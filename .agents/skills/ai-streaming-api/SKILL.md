---
name: ai-streaming-api
description: Guidelines for modifying OpenUI's AI generation API routes, building streaming prompts with deviceContext, and processing streamed HTML. Use when updating AI models, adding new generation features, fixing streaming loops, or working with the theme/retheme endpoints.
---

# AI Streaming API Integration

OpenUI streams generation data directly into the Redux state in real-time, allowing the user to watch the canvas build.

## When to Use This Skill
- You are editing `app/api/generate/route.ts` or `app/api/generate/redesign/route.ts`.
- You are building new endpoints that stream code (e.g. Framework Converters).
- You are parsing TextDecoder streams in React components.
- You are modifying the **AI Theme Generator** (`/api/generate/theme/`) or **Retheme** (`/api/generate/retheme/`) endpoints.

## 1. Constructing Prompts (Device Context & Word Bank)

When prompting the AI, always inject the system context containing:
- The **Design Tokens** (Theme colors, font families, radii, spacing).
- The **Device Context** (Mobile, Tablet, Desktop) rules.
- The **Style Word Bank** (Atmosphere, texture preferences).

```typescript
// Always append device specific logic
const deviceInstructions = deviceContexts[deviceType || "desktop"];
const systemMessage = `You are an expert UI designer... ${deviceInstructions}`;
```

## 2. Server-Side Streaming (Next.js App Router)

Do not return JSON or raw stream boilerplate for streaming responses. Use the centralized `createStreamResponse` utility:

```typescript
import { streamText } from "ai";
import { createStreamResponse } from "@/lib/ai/route-utils";

const result = streamText({
  model,
  messages,
});
return createStreamResponse(result.textStream);
```

## 3. Structured Object Generation (Non-Streaming)

For endpoints that return structured JSON (like `/api/generate/theme`), use `generateText` with `Output.object()` and a Zod schema. Note that you do not need `as any` casts:

```typescript
import { generateText, Output } from "ai";
import z from "zod";

const ThemeSchema = z.object({
  theme: z.string(),
  colorSections: z.array(ColorSectionSchema),
  // ...
});

const result = await generateText({
  model, // Properly typed LanguageModel
  output: Output.object({ schema: ThemeSchema }),
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: userPrompt }],
});

// result.output is now typed according to ThemeSchema
```

## 4. Model Resolution Pattern

All API routes MUST resolve the AI model using the shared `resolveModelForProject` helper:

```typescript
import { resolveModelForProject } from "@/lib/ai/route-utils";

// Resolve model for the given project ID (requires vision model if true)
const { model, errorResponse } = await resolveModelForProject(projectId, false);
if (errorResponse) {
  return errorResponse; // project not found (404)
}

// Proceed with 'model' (properly typed as LanguageModel)
```

## 5. Client-Side Stream Parsing

When consuming the stream in a component, do not poll. Use a `while(true)` reader loop and dispatch Redux patches to update the UI on the fly:

```typescript
const reader = response.body?.getReader();
let accumulated = "";

if (reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // Decode and append chunk
    const chunk = decoder.decode(value, { stream: true });
    accumulated += chunk;
    
    // Dispatch patch directly to Redux entity
    dispatch(updateShape({ id: shapeId, patch: { uiSpecData: accumulated } }));
  }
}
```

## 6. Retheme Pattern

The retheme endpoint (`/api/generate/retheme`) uses streaming to apply new design tokens to existing HTML. The client iterates over all `generatedui` shapes and streams each one:

```typescript
const tokenHash = computeTokenHash(guide);

for (const shape of generatedUIShapes) {
  const response = await fetch("/api/generate/retheme", {
    method: "POST",
    body: JSON.stringify({ html: shape.uiSpecData, tokens, projectId }),
  });
  // Read stream to completion, then dispatch update with new tokenHash
  dispatch(updateShape({ id: shape.id, patch: { uiSpecData: result, tokenHash } }));
}
```

## 7. API Route Directory

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate` | POST | Generate UI from text prompt (streaming) |
| `/api/generate/redesign` | POST | Redesign existing UI via chat (streaming) |
| `/api/generate/theme` | POST | AI theme generation from text prompt (structured JSON) |
| `/api/generate/retheme` | POST | Apply new tokens to existing HTML (streaming) |
| `/api/generate/convert` | POST | Convert HTML to React/Vue/Angular/Svelte (streaming) |
| `/api/generate/style` | POST | Generate style guide from moodboard images (structured JSON) |
| `/api/generate/workflow` | POST | Generate multi-screen workflows (streaming) |
