import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export type ProviderKey =
  | "openrouter"
  | "nvidia"
  | "ollama"
  | "anthropic"
  | "openai"
  | "google";

export function getLanguageModel(provider: ProviderKey, modelId: string) {
  // Strip provider prefix if present in the stored modelId (e.g. "openrouter/google/gemini" -> "google/gemini")
  let cleanModelId = modelId;
  const prefix = `${provider}/`;
  if (modelId.startsWith(prefix)) {
    cleanModelId = modelId.substring(prefix.length);
  }

  switch (provider) {
    case "openrouter":
      return createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY || "",
      })(cleanModelId);
    case "nvidia":
      return createOpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: process.env.NVIDIA_NIM_API_KEY || "",
      })(cleanModelId);
    case "ollama":
      return createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
        apiKey: "ollama",
      })(cleanModelId);
    case "anthropic":
      return anthropic(cleanModelId);
    case "openai":
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY || "",
      })(cleanModelId);
    case "google":
      return google(cleanModelId);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/** Parse a prefixed model string like "openrouter/anthropic/claude-opus-4" */
export function parseModelString(fullId: string): {
  provider: ProviderKey;
  modelId: string;
} {
  const [provider, ...rest] = fullId.split("/");
  if (!provider || rest.length === 0) {
    throw new Error(`Invalid model ID format: ${fullId}`);
  }
  return { provider: provider as ProviderKey, modelId: rest.join("/") };
}

/** Resolve fallback model from NEXT_PUBLIC_OPENUI_FALLBACK_MODEL env var */
export function getFallbackModel() {
  const fallback = process.env.NEXT_PUBLIC_OPENUI_FALLBACK_MODEL;
  if (!fallback) {
    throw new Error("NEXT_PUBLIC_OPENUI_FALLBACK_MODEL is not set in env");
  }
  const { provider, modelId } = parseModelString(fallback);
  return getLanguageModel(provider, modelId);
}

// TODO: Change fallback vision-enabled models for different providers.
const PROVIDER_VISION_FALLBACKS: Record<ProviderKey, string> = {
  openrouter: "qwen/qwen3.7-plus",
  openai: "gpt-5.5-2026-04-23",
  anthropic: "claude-fable-5",
  google: "gemini-3.5-flash",
  nvidia: "meta/llama-3.2-11b-vision-instruct",
  ollama: "gemma4",
};

export function isVisionModel(modelId: string): boolean {
  const id = modelId.toLowerCase();
  return (
    id.includes("vision") ||
    id.includes("-vl") ||
    id.includes("vl-") ||
    id.includes("gemini") ||
    id.includes("gpt-4o") ||
    id.includes("gpt-5") ||
    id.includes("claude") ||
    id.includes("pixtral") ||
    id.includes("llava") ||
    id.includes("bakllava") ||
    id.includes("llama-3.2") ||
    id.includes("qwen2.5-vl") ||
    id.includes("qwen-2.5-vl") ||
    id.includes("qwen3.7-plus")
  );
}

export function getVisionLanguageModel(provider: ProviderKey, modelId: string) {
  if (isVisionModel(modelId)) {
    return getLanguageModel(provider, modelId);
  }

  const fallbackModelId =
    PROVIDER_VISION_FALLBACKS[provider] || PROVIDER_VISION_FALLBACKS.openrouter;
  console.warn(
    `Selected model "${modelId}" does not support vision. Falling back to vision model "${fallbackModelId}"`,
  );
  return getLanguageModel(provider, fallbackModelId);
}
