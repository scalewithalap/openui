import { NextRequest, NextResponse } from "next/server";
import {
  getLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { createStreamResponse } from "@/lib/ai/route-utils";
import { prisma } from "@/lib/db";
import { streamText } from "ai";

const FRAMEWORK_PROMPTS: Record<string, string> = {
  react: `You are a senior React developer. Convert the given HTML + Tailwind CSS into a modern React functional component.

Rules:
- Use TypeScript (.tsx)
- Use React hooks (useState, useEffect, etc.) where appropriate
- Convert class to className
- Keep all Tailwind CSS classes exactly as-is
- Use semantic component names
- Add proper TypeScript types/interfaces for props
- Export the component as default
- Wrap the entire output in a single code block
- Do NOT include any import for React (React 18+ doesn't require it)
- Include necessary imports (e.g., useState from 'react')
- Make interactive elements functional (buttons, inputs, forms)`,

  vue: `You are a senior Vue.js developer. Convert the given HTML + Tailwind CSS into a Vue 3 Single File Component.

Rules:
- Use <script setup lang="ts"> with Composition API
- Keep all Tailwind CSS classes exactly as-is
- Use ref() and reactive() for state
- Use proper TypeScript types
- Wrap the entire output in a single code block
- Include <template>, <script setup>, and optionally <style> sections
- Make interactive elements functional`,

  angular: `You are a senior Angular developer. Convert the given HTML + Tailwind CSS into an Angular standalone component.

Rules:
- Use Angular 17+ standalone component syntax
- Keep all Tailwind CSS classes exactly as-is
- Use TypeScript with proper typing
- Include @Component decorator with inline template
- Use signals for reactive state where appropriate
- Wrap the entire output in a single code block
- Make interactive elements functional`,

  svelte: `You are a senior Svelte developer. Convert the given HTML + Tailwind CSS into a Svelte 5 component.

Rules:
- Use Svelte 5 runes ($state, $derived, $effect)
- Keep all Tailwind CSS classes exactly as-is
- Use TypeScript with <script lang="ts">
- Wrap the entire output in a single code block
- Include <script>, HTML template, and optionally <style> sections
- Make interactive elements functional`,
};

export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    const body = JSON.parse(rawText);
    const { html, framework, projectId, streamId } = body;
    const activeStreamId = streamId || "convert-framework";

    if (!html || !framework || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: html, framework, projectId" },
        { status: 400 },
      );
    }

    if (!FRAMEWORK_PROMPTS[framework]) {
      return NextResponse.json(
        {
          error: `Unsupported framework: ${framework}. Supported: react, vue, angular, svelte`,
        },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { settings: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found!" },
        { status: 404 },
      );
    }

    // Resolve model
    let model;
    try {
      const settings = project.settings;
      if (settings?.provider && settings?.model) {
        model = getLanguageModel(
          settings.provider as ProviderKey,
          settings.model,
        );
      } else {
        console.warn(`[Generate Convert] project.settings is missing or incomplete. Settings: ${JSON.stringify(settings)}`);
        model = getFallbackModel();
      }
    } catch (err) {
      console.warn("[Generate Convert] Failed to resolve project model, using fallback. Error details:", err);
      model = getFallbackModel();
    }

    const systemPrompt = FRAMEWORK_PROMPTS[framework];

    const userPrompt = `Convert this HTML + Tailwind CSS UI into a ${framework} component:

\`\`\`html
${html.substring(0, 8000)}
\`\`\`

Generate a complete, production-ready ${framework} component. Output ONLY the code, no explanations.`;

    const result = streamText({
      model: model as Parameters<typeof streamText>[0]["model"],
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
      temperature: 0.35,
    });

    return createStreamResponse(result.textStream, "text/event-stream; charset=utf-8", activeStreamId);
  } catch (error) {
    console.error("Convert API error:", error);
    return NextResponse.json(
      {
        error: "Failed to convert code.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
