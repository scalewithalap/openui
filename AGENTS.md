# AGENTS.md — Agent Operational Guide

This document defines the operational boundaries, directory map, and behavioral rules for AI coding agents operating on the OpenUI project. It acts as the standard protocol for agent interactions across all AI tools (Claude Code, Cursor, Copilot, Antigravity, etc.).

> **Read this file first.** Then read the relevant SKILL.md files in `.agents/skills/` before planning or executing complex changes.

## 🤖 MCP Server Usage (Top Priority)

AI agents **MUST** leverage available MCP (Model Context Protocol) servers when they are available. MCP servers provide specialized tools that produce better results and finish tasks faster.

| Server | Purpose | When to Use |
|--------|---------|-------------|
| `graphify-oui` | OpenUI codebase graph analysis | Understanding code relationships, finding dependencies, tracing data flow |
| `firecrawl` | Web scraping & research | Fetching documentation, researching APIs, comparing implementations |
| `sequential-thinking` | Multi-step reasoning | Breaking down complex tasks, architectural decisions, debugging |
| `context7` | Library documentation lookup | Checking latest API docs for Next.js, Prisma, Redux Toolkit, etc. |

**Rules:**
- Always prefer MCP tools over manual web searches or guesswork.
- Use `sequential-thinking` for any task requiring 3+ logical steps.
- Use `graphify-oui` before modifying code that touches multiple modules.

---

## 📖 Required Reading Before Major Changes

Before planning or executing any significant changes, agents **MUST** read the relevant skill files:

| Area | Required Skill File |
|------|-------------------|
| Canvas shapes, selection, minimap | `.agents/skills/canvas-rendering/SKILL.md` |
| Redux slices, entity state, history | `.agents/skills/redux-state-management/SKILL.md` |
| Design tokens, theme presets, DESIGN.md | `.agents/skills/design-system/SKILL.md` |
| API routes, streaming, AI generation | `.agents/skills/ai-streaming-api/SKILL.md` |

---

## 🚧 Rules of Engagement (The 3-Tier Model)

### ✅ ALWAYS DO
- **Verify TypeScript Compliance**: Run `npx tsc --noEmit` to verify code changes before completing a task.
- **Read Skills**: When taking on complex tasks related to the canvas, AI generation, design tokens, or Redux state, refer to the skills inside `.agents/skills/`.
- **Use Absolute Imports**: Use the `@/` path alias for all internal imports instead of relative paths (e.g. `import { cn } from "@/lib/utils"`).
- **Use MCP Servers**: Always leverage available MCP servers for research, code analysis, and multi-step reasoning.
- **Cast EntityState Dictionaries**: When accessing `state.shapes.shapes.entities`, always cast via `(Object.values(entities) as (Shape | undefined)[])` before filtering.

### ✋ ASK FIRST
- **Installing New Dependencies**: Ask for permission before modifying `package.json` to add new npm libraries. Use existing Radix UI primitives and Lucide icons whenever possible.
- **Modifying the Prisma Schema**: If a feature requires changes to `prisma/schema.prisma`, ask the user to confirm the schema change design before proceeding.
- **Resetting the Database**: Ask before running `npm run db:reset`, as this drops all user data.
- **New API Routes**: Confirm the endpoint design and request/response schema before implementing new routes in `app/api/`.

### 🛑 NEVER DO
- **Never bypass strict TypeScript checking.** Do not use `// @ts-ignore`, `// @ts-expect-error`, or `any` unless forced by an external library.
- **Never commit environment secrets.** The `.env.local` file contains API keys for AI providers (OpenAI, Anthropic, Gemini, etc.). Never commit or log these.
- **Never modify the `data/` or `.next/` folders directly.** The SQLite database resides in `data/openui.db`.
- **Never hardcode colors or data** in `DesignSystemDetails` or theme components. All values must be computed dynamically from the style guide state.

---

## 📁 Workspace Hierarchy Mapping

### Core Architecture
- `app/api/` — Serverless API routes and streaming endpoints.
  - `app/api/generate/` — AI generation routes (generate, redesign, theme, retheme, convert, workflow).
  - `app/api/projects/` — Project CRUD and style guide persistence.
- `components/canvas/` — The core interactive canvas, including selection mechanics, zoom, and shape rendering.
  - `components/canvas/shapes/generatedui/` — The primary `GeneratedUI` shape: design preview, AI chat, code conversion, theme popovers, design tokens editor.
  - `components/canvas/minimap.tsx` — Proportional canvas minimap with click-to-navigate.
- `redux/slice/` — State management logic.
  - `redux/slice/shapes/` — Canvas element state (EntityAdapter).
  - `redux/slice/style-guide.ts` — Design tokens, theme presets, snapshot history.
  - `redux/slice/viewport/` — Pan, zoom, and viewport state.

### Libraries & Utilities
- `lib/ai/` — Model registry mapping and AI provider integration (OpenRouter, NVIDIA, Ollama, Anthropic, OpenAI, Google).
- `lib/db/` — Prisma database utility connections and data models.
- `lib/contrast.ts` — WCAG contrast ratio checker.
- `lib/color-extract.ts` — k-means color clustering for moodboard extraction.
- `lib/theme-presets.ts` — 10 curated design system presets.
- `lib/frame-snapshot.ts` — HTML snapshot and export utilities.

### Hooks
- `hooks/use-canvas.ts` — Core canvas interaction logic (60K+ lines).
- `hooks/use-token-injection.ts` — Live CSS variable injection into iframes via postMessage.
- `hooks/use-snap-grid.ts` — Grid snapping and alignment guide computation.
- `hooks/use-styles.ts` — Moodboard and style management hooks.

### Agent Configuration
- `.agents/skills/` — Modular skill files for complex subsystems.
- `.agents/rules/system-prompt.md` — System prompt for AI agents.
- `DESIGN.md` — Design system specification, YAML frontmatter, and workspace theming (light/dark mode) guidelines.
