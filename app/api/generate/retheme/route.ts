import { NextRequest } from "next/server";
import {
  getLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { prisma } from "@/lib/db";
import { streamText } from "ai";
import { createStreamResponse } from "@/lib/ai/route-utils";

const RETHEME_SYSTEM_PROMPT = `You are a frontend design system expert. Your task is to retheme an existing HTML UI by applying new design tokens.

CRITICAL RULES:
1. Do NOT change the layout, structure, content, or functionality of the HTML.
2. ONLY change visual properties: colors, fonts, spacing, border-radius, shadows, backgrounds.
3. Replace hardcoded color values (hex, rgb, hsl, color names) with the new token values.
4. Replace hardcoded font-family values with the new token fonts.
5. Replace hardcoded border-radius values with the new token radius values.
6. Replace hardcoded spacing/padding/margin values to use the new spacing unit as a baseline.
7. Use CSS custom properties where possible (e.g., var(--color-primary)).
8. Return ONLY the modified HTML — no markdown fences, no explanation, no comments.
9. Preserve all Tailwind CSS classes but update color classes to match the new palette.
10. Keep all interactive elements, scripts, and data attributes intact.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, tokens, projectId, streamId } = body;
    const activeStreamId = streamId || "retheme-ui";

    if (!html || !tokens || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: html, tokens, projectId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { settings: true },
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
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
        model = getFallbackModel();
      }
    } catch (err) {
      console.warn("Failed to resolve project model, using fallback:", err);
      model = getFallbackModel();
    }

    // Build the token context string
    const tokenContext = `
## New Design Tokens to Apply

### Colors
- Primary: ${tokens.primaryColor || "#db2800"}
- Background / Surface: ${tokens.bgColor || "#faf8f5"}
- Text: ${tokens.textColor || "#2e2925"}
- Accent / Secondary: ${tokens.accentColor || "#8a9a86"}
- Success: ${tokens.successColor || "#10B981"}
- Warning: ${tokens.warningColor || "#F59E0B"}
- Error: ${tokens.errorColor || "#EF4444"}
- Info: ${tokens.infoColor || "#3B82F6"}

### Typography
- Heading Font: ${tokens.headingFont || "Inter"}
- Body Font: ${tokens.bodyFont || "DM Sans"}

### Layout
- Card Border Radius: ${tokens.cardRadius || 16}px
- Button Border Radius: ${tokens.buttonRadius || 8}px
- Base Spacing: ${tokens.spacingUnit || 16}px
`;

    const result = streamText({
      model: model as Parameters<typeof streamText>[0]["model"],
      system: RETHEME_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${tokenContext}\n\n## Current HTML to Retheme\n\n${html}`,
        },
      ],
    });

    return createStreamResponse(result.textStream, "text/event-stream; charset=utf-8", activeStreamId);
  } catch (error) {
    console.error("Error in retheme API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to retheme",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
