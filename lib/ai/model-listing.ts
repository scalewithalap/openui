import { ProviderKey } from "./provider-registry";

export interface AvailableModel {
  id: string; // Prefixed ID: "openrouter/meta-llama/llama-3-70b-instruct"
  name: string; // Human-readable: "Llama 3 70B Instruct"
  provider: ProviderKey;
  rawId: string; // Provider-specific ID: "meta-llama/llama-3-70b-instruct"
  contextLength?: number;
  supportsVision?: boolean;
}

export function getEnabledProviders(): ProviderKey[] {
  const providers: ProviderKey[] = [];
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");
  if (process.env.NVIDIA_NIM_API_KEY) providers.push("nvidia");
  if (
    process.env.OLLAMA_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_OLLAMA_ENABLED === "true" ||
    (process.env.OLLAMA_BASE_URL &&
      process.env.OLLAMA_ENABLED !== "false" &&
      process.env.NEXT_PUBLIC_OLLAMA_ENABLED !== "false")
  ) {
    providers.push("ollama");
  }
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GEMINI_API_KEY) providers.push("google");
  return providers;
}

export async function fetchAllModels(): Promise<AvailableModel[]> {
  const enabled = getEnabledProviders();

  // H1 fix: Each provider collects into its own local array to avoid shared-mutation race
  const promises = enabled.map(async (provider): Promise<AvailableModel[]> => {
    const providerModels: AvailableModel[] = [];
    try {
      if (provider === "openrouter") {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        });
        if (response.ok) {
          const json = await response.json();
          const models = json.data || [];
          models.forEach(
            (m: {
              id: string;
              name?: string;
              architecture?: { input_modalities?: string[] };
              description?: string;
              context_length?: number;
            }) => {
              const hasVision =
                m.architecture?.input_modalities?.includes("image") ||
                m.description?.toLowerCase().includes("vision") ||
                false;
              providerModels.push({
                id: `openrouter/${m.id}`,
                name: m.name || m.id,
                provider: "openrouter",
                rawId: m.id,
                contextLength: m.context_length,
                supportsVision: hasVision,
              });
            },
          );
        }
      }

      if (provider === "nvidia") {
        const response = await fetch(
          "https://integrate.api.nvidia.com/v1/models",
          {
            headers: {
              Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
            },
          },
        );
        if (response.ok) {
          const json = await response.json();
          const models = json.data || [];
          models.forEach((m: { id: string }) => {
            const lowerId = m.id.toLowerCase();
            const hasVision =
              lowerId.includes("vision") || lowerId.includes("vl");
            providerModels.push({
              id: `nvidia/${m.id}`,
              name: m.id.split("/").pop() || m.id,
              provider: "nvidia",
              rawId: m.id,
              supportsVision: hasVision,
            });
          });
        }
      }

      if (provider === "ollama") {
        const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/tags`);
        if (response.ok) {
          const json = await response.json();
          const models = json.models || [];
          models.forEach(
            (m: { name: string; details?: { families?: string[] } }) => {
              const lowerName = m.name.toLowerCase();
              const hasVision =
                lowerName.includes("llava") ||
                lowerName.includes("bakllava") ||
                lowerName.includes("vision") ||
                m.details?.families?.includes("clip");
              providerModels.push({
                id: `ollama/${m.name}`,
                name: m.name,
                provider: "ollama",
                rawId: m.name,
                supportsVision: hasVision,
              });
            },
          );
        }
      }

      if (provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        });
        if (response.ok) {
          const json = await response.json();
          const models = json.data || [];
          // Updated June 2026: Include gpt-5.x frontier family
          const allowedPrefixes = ["gpt-5", "gpt-4o", "gpt-4.1", "o1", "o3", "o4"];
          models.forEach((m: { id: string }) => {
            const isAllowed = allowedPrefixes.some((p) => m.id.startsWith(p));
            if (isAllowed) {
              const hasVision =
                m.id.includes("gpt-5") ||
                m.id.includes("gpt-4o") ||
                m.id.includes("gpt-4.1") ||
                m.id.includes("vision");
              providerModels.push({
                id: `openai/${m.id}`,
                name: m.id,
                provider: "openai",
                rawId: m.id,
                supportsVision: hasVision,
              });
            }
          });
        }
      }

      if (provider === "anthropic") {
        // Updated June 2026: Claude 4.x family + Fable 5
        const anthropicModels = [
          {
            rawId: "claude-fable-5",
            name: "Claude Fable 5",
            vision: true,
          },
          {
            rawId: "claude-opus-4-8",
            name: "Claude Opus 4.8",
            vision: true,
          },
          {
            rawId: "claude-sonnet-4-6",
            name: "Claude Sonnet 4.6",
            vision: true,
          },
          {
            rawId: "claude-haiku-4-5",
            name: "Claude Haiku 4.5",
            vision: true,
          },
        ];
        anthropicModels.forEach((m) => {
          providerModels.push({
            id: `anthropic/${m.rawId}`,
            name: m.name,
            provider: "anthropic",
            rawId: m.rawId,
            supportsVision: m.vision,
          });
        });
      }

      if (provider === "google") {
        // Updated June 2026: Gemini 3.x family + 2.5 stable
        const googleModels = [
          { rawId: "gemini-3.5-flash", name: "Gemini 3.5 Flash", vision: true },
          { rawId: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite", vision: true },
          { rawId: "gemini-2.5-pro", name: "Gemini 2.5 Pro", vision: true },
          { rawId: "gemini-2.5-flash", name: "Gemini 2.5 Flash", vision: true },
          { rawId: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", vision: true },
        ];
        googleModels.forEach((m) => {
          providerModels.push({
            id: `google/${m.rawId}`,
            name: m.name,
            provider: "google",
            rawId: m.rawId,
            supportsVision: m.vision,
          });
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch models for provider ${provider}:`, error);
    }
    return providerModels;
  });

  const settled = await Promise.allSettled(promises);
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
