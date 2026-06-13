# OpenUI — Claude Code Onboarding Guide

Welcome! This is the `CLAUDE.md` onboarding guide for OpenUI. This file gives Claude Code (and compatible agents) immediate context on the project's commands, conventions, and architectural rules.

> **Before starting any complex task**, read the relevant SKILL.md files in `.agents/skills/` and the full `AGENTS.md` file at the project root.

## 🤖 MCP Server Usage (Top Priority)

When MCP servers are available, **always use them**. They produce better results and finish tasks faster:

- **`graphify-oui`** — Codebase graph analysis. Use before modifying code that touches multiple modules.
- **`firecrawl`** — Web scraping & research. Use for fetching documentation and comparing implementations.
- **`sequential-thinking`** — Multi-step reasoning. Use for any task requiring 3+ logical steps.
- **`context7`** — Library documentation lookup. Use for checking latest API docs.

## 🛠️ Project Context

OpenUI is a local-first, provider-agnostic UI design and prototyping platform. It generates Tailwind CSS HTML from text prompts, renders them on a complex interactive canvas, and stores data in a local SQLite database using Prisma.

### Key Subsystems (v1.0.0)

- **Interactive Canvas** — Pan/zoom, shapes, frames, arrows, notes, free drawing, laser pointer
- **AI Generation Pipeline** — Streaming UI generation, redesign chat, workflow generation
- **Design System** — Type-safe tokens, live iframe injection, 10 curated presets, AI theme generation
- **Version History** — Snapshot save/restore/delete for design tokens
- **Canvas Minimap** — Proportional shape overview with click-to-navigate
- **Export Pipeline** — HTML, React, Vue, Angular, Svelte conversion + ZIP export
- **Workspace Theming** — Seamless light and dark mode toggling with next-themes and custom CSS properties

## 💻 Tech Stack & Versions

- **Next.js**: 16.2.9 (App Router, Turbopack)
- **React**: 19.2.7
- **Redux Toolkit**: 2.12.0
- **Tailwind CSS**: 4.3.0
- **Prisma**: 7.8.0
- **TypeScript**: 6.0.3
- **Vercel AI SDK**: Latest (streamText, generateText, Output.object)

## ⚙️ Essential Commands

- **Run Dev Server**: `npm run dev`
- **Build App**: `npm run build`
- **Database Migrations/Setup**: `npm run setup`
- **TypeScript Check**: `npx tsc --noEmit`

## 📐 Core Conventions & Rules

### 1. TypeScript Strictness

- **Never use `any`** unless forced by an external library constraint.
- **Redux Entity Adapter typing**: When using `Object.values(allShapesEntities)` from the `EntityState` dictionary in `shapes` slice, TypeScript often infers it as `{}[]`. You **MUST** cast it explicitly before filtering to avoid property access errors.
  _Example:_ `(Object.values(allShapesEntities) as (Shape | undefined)[]).filter(...)`

### 2. Design Tokens (CRITICAL)

- **Never hardcode colors or data** in `DesignSystemDetails` or theme components. All values must be dynamically resolved from `state.styleGuide.guide`.
- The `ExtendedStyleGuide` uses dynamic `colorSections[]` and `typographySections[]` — never assume fixed indices.
- Use the `find()` pattern with section titles: `guide.colorSections.find(s => s.title === "Primary Colors")`

### 3. Live Token Injection

- Iframes use `postMessage` to receive CSS variable updates from `useTokenInjection()`.
- Always tag iframes with `data-openui-shape={shape.id}` for the broadcaster to find them.
- Include `TOKEN_LISTENER_SCRIPT` in `srcDoc` for any iframe that should respond to theme changes.

### 4. Styling

- **Tailwind Utility Classes Only**: Use Tailwind classes for all styling.
- **No raw inline styles**: Do not write `style={{ ... }}` for things that can be done with Tailwind.
- **Use the Token System**: Follow the `style-guide.ts` tokens for theming. Use `cn()` from `@/lib/utils` for conditional class merging.

### 5. Component Structure

- **App Router Rules**: The project uses the Next.js App Router (`app/` directory).
- **Client Components**: Any component that uses hooks (`useState`, `useAppSelector`, etc.) must start with `"use client";` at the top.
- **Absolute Imports**: Always use `@/` path alias (e.g., `import { cn } from "@/lib/utils"`).

### 6. API Routes

- Use `streamText` from `ai` SDK for streaming responses.
- Use `generateText` with `Output.object({ schema })` for structured JSON responses.
- Always resolve the AI model from project settings via `getLanguageModel()` with `getFallbackModel()` as backup.

## ✅ Quality Gate

Before concluding any task that modifies code, **ALWAYS run `npx tsc --noEmit`** to verify that you have not introduced any type errors. Do not submit a fix if the build fails.
