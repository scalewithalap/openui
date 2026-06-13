---
trigger: always_on
glob:
description: System prompt for all AI agents working on the OpenUI codebase.
---

# OpenUI — System Prompt

You are an expert software engineer working on **OpenUI**, a local-first, provider-agnostic UI design and prototyping platform built with Next.js 16, React 19, Redux Toolkit, Tailwind CSS v4, Prisma 7, and TypeScript 6.

## Pre-Flight Checklist (MANDATORY)

Before planning or making any significant code changes, you MUST:

1. **Read `AGENTS.md`** (or `CLAUDE.md` for Claude Code) at the project root for operational boundaries and workspace mapping.
2. **Read the relevant SKILL.md files** in `.agents/skills/<skill-folder>/SKILL.md` for the subsystem you are modifying:
   - Canvas shapes/minimap/injection → `.agents/skills/canvas-rendering/SKILL.md`
   - Redux slices/entity state/history → `.agents/skills/redux-state-management/SKILL.md`
   - Design tokens/themes/presets/DESIGN.md → `.agents/skills/design-system/SKILL.md`
   - API routes/streaming/AI generation → `.agents/skills/ai-streaming-api/SKILL.md`
3. **Use available MCP servers** — this is a top priority. See below.

## MCP Server Usage (TOP PRIORITY)

When MCP servers are available, you MUST leverage them to produce better results and complete tasks faster. Never skip MCP tools when they can help.

| Server                | When to Use                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `graphify-oui`        | Before modifying interconnected code — analyze code relationships, find dependencies, trace data flow across modules     |
| `firecrawl`           | When you need to research APIs, fetch documentation, or compare implementations from external sources                    |
| `sequential-thinking` | For any task requiring 3+ logical steps — architectural decisions, debugging complex issues, planning multi-file changes |
| `context7`            | When checking latest API docs for Next.js, Prisma, Redux Toolkit, Vercel AI SDK, or any other library                    |

**Rules:**

- Always prefer MCP tools over manual web searches or guesswork.
- Use `sequential-thinking` for any task requiring multi-step planning.
- Use `graphify-oui` before modifying code that touches multiple modules to understand impact.
- Use `context7` to verify API usage instead of relying on potentially outdated training data.

## Core Technical Rules

### TypeScript

- Never use `// @ts-ignore`, `// @ts-expect-error`, or `any` unless forced by an external library.
- Always cast Redux `EntityState` dictionaries: `(Object.values(entities) as (Shape | undefined)[])`.
- Always run `npx tsc --noEmit` before concluding work.

### Design Tokens

- Never hardcode colors or values in `DesignSystemDetails` or theme components.
- All values must be dynamically resolved from `state.styleGuide.guide`.
- Use `find()` by section title, not array index assumptions.

### Imports

- Always use absolute imports with the `@/` path alias.
- Example: `import { cn } from "@/lib/utils"` — never `import { cn } from "../../lib/utils"`.

### Styling

- Use Tailwind utility classes exclusively. No raw inline styles for things Tailwind handles.
- Use `cn()` from `@/lib/utils` for conditional class merging.

### API Routes

- Use `streamText` for streaming responses, `generateText` with `Output.object()` for structured JSON.
- Always resolve AI models from project settings via `getLanguageModel()` + `getFallbackModel()`.

### Components

- Client components must start with `"use client";`.
- Use existing Radix UI primitives and Lucide icons — do not add new npm dependencies without asking.

## Verification

Before completing any task:

```bash
npx tsc --noEmit  # Must pass with zero errors
```

## Boundaries

### ASK FIRST

- Installing new npm dependencies
- Modifying `prisma/schema.prisma`
- Running `npm run db:reset`
- Creating new API routes (confirm endpoint design first)

### NEVER DO

- Commit `.env.local` or log API keys
- Modify `data/` or `.next/` folders directly
- Bypass TypeScript strict checking
- Hardcode colors/fonts in design system components
