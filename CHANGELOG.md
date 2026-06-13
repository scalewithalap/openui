# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-12

### 🎉 Initial Release

The first public release of OpenUI — a local-first, provider-agnostic UI design and prototyping platform.

---

### Core Platform

- **Local-first architecture** with SQLite + Prisma ORM — no cloud database dependencies.
- **Provider-agnostic AI pipeline** supporting OpenRouter, NVIDIA NIM, Ollama (offline), Anthropic, OpenAI, and Google Gemini.
- **Up-to-date model registry** providing June 2026 OpenAI, Anthropic, and Google Gemini model listings.
- **Searchable model registry** with per-project model selection and dynamic vision model fallbacks.
- **Local file asset management** for moodboard and inspiration images with secure static endpoints.
- **Path validation and resolution** to prevent directory traversal vulnerability on static upload serving.
- **Strict upload validation** applying size limits (10MB on uploads, 500KB on thumbnails) and strict image MIME checks.
- **Client payload filtering** to prevent raw internal stack trace leaks in select model error payloads.
- **Project dashboard** with create, open, delete, and settings management.
- **MIT Open-Source Licensing** covering the codebase.

---

### Interactive Canvas

- **Infinite canvas** with pan/zoom (0.1x–8x scale), radial dot grid background, and viewport state persistence.
- **Shape tools**: Rectangle, Ellipse, Frame, Note, Arrow, Line, Connector, Free Draw, Text.
- **Consolidated canvas shape utilities** (getShapeRect, getShapeCenter, getBestConnectionPoints, calculateArrowHead) inside a shared helper file to eliminate code duplication.
- **Selection system** with bounding boxes, multi-select, and property toolbars.
- **Laser pointer tool** with animated cursor and fading trail.
- **Automatic RAF loop sleep** deactivating the RequestAnimationFrame drawing loop when laser coordinates are empty.
- **Eraser tool** for shape deletion by click.
- **Deletion boundary check** preventing duplicate frame names by skipping negative index offsets.
- **Canvas minimap** — proportional SVG overview in the bottom-right corner with color-coded shapes and click-to-navigate.
- **Grid snapping** — snap shape positions to 20/40/60px grids during drag operations.
- **Alignment guides** — automatic edge/center alignment detection against other shapes (6px threshold).
- **Batched element drag updates** merging multi-shape updates into a single reducer dispatch to reduce rendering cost.

---

### AI Generation & Redesign

- **Streaming UI generation** — text-to-Tailwind-HTML pipeline with real-time canvas preview.
- **Centralized streaming logic** using shared resolve-model and stream-response handlers to eliminate TextEncoder garbage collection pressure.
- **Redesign chat** — iterate on existing UI via conversational prompts with streaming updates.
- **Style Word Bank** — curated visual style vocabulary (Atmosphere, Layout, Texture, Color) for prompt augmentation.
- **Reference image attachment** — inject moodboard/inspiration images into generation context.
- **Zod style validation** allowing case-insensitive hex characters (a-fA-F).
- **Device viewport simulation** — Mobile, Tablet, Desktop rendering with automatic layout translation.
- **Parallel variant generation** — generate up to 5 simultaneous visual variations per prompt.
- **Creative range control** — temperature/aesthetic slider (Refined → Creative).
- **Side-by-side variant comparison** — synchronized iframe views for evaluating and selecting variants.
- **Fullscreen interactive preview** — scrollable responsive iframe wrapper with device frame simulation.
- **Multi-screen workflow generation** — connected multi-page application flows from a single prompt.
- **Workflow redesign** — iterate on individual screens within a workflow flow.

---

### Design System & Tokens

- **Type-safe `ExtendedStyleGuide`** — strongly-typed interfaces with Zod-validated schemas.
- **Expanded token model** — 11 semantic colors (primary, surface, text, accent, success, warning, error, info, surface-variant, muted, border), 4 elevation shadows, border width, overlay opacity.
- **`DesignSystemDetails`** — minimal interface with `cardRadius`, `buttonRadius`, `spacingUnit`, and `designMd`.
- **YAML frontmatter specification** — complete token schema in DESIGN.md with bidirectional sync (`parseMarkdownToGuide` / `generateMarkdownFromGuide`).
- **WCAG contrast checker** — real-time AA/AAA contrast ratio badges for text-on-background combinations (`lib/contrast.ts`).
- **Design tokens visual editor** — split-screen editor with visual controls (left) and raw markdown (right).
- **DESIGN.md export/import** — export token state as markdown, import to synchronize styling.
- **Autosave schema validation** verifying shapes metadata structure.

---

### Live Token Injection

- **`useTokenInjection()` hook** — broadcasts CSS custom properties to all canvas iframes via `postMessage` when design tokens change.
- **`TOKEN_LISTENER_SCRIPT`** — inline script injected into iframe `srcDoc` to receive and apply CSS variable updates.
- **Same-origin preview sandbox** (`allow-same-origin`) enabling the parent page to capture canvas snapshots for PNG export.
- **`data-openui-shape` attribute** — tags iframes for the broadcaster to find them.
- **Token sync tracking** — `tokenHash` field on `GeneratedUIShape` with swatch strip showing sync status (✓/⚠).
- **Swatch strip UI** — 4 color dots (primary, bg, text, accent) + heading font name + sync indicator below each generated UI shape.

---

### AI-Powered Theme Features

- **AI Theme Generator** — `/api/generate/theme` endpoint accepting text prompts (e.g., "cyberpunk neon dashboard") and returning structured `ExtendedStyleGuide` via Zod-validated AI output.
- **AI Generate button** — violet gradient card in the design tokens editor with text input and sparkles icon.
- **10 curated theme presets** — Midnight Blue, Forest, Sunset Warm, Corporate, Glassmorphism, Neon Pop, Pastel Dream, Earth Tone, Arctic, Monochrome (`lib/theme-presets.ts`).
- **Theme presets gallery** — clickable preset cards in the Edit Theme Popover with color swatches, font preview, and active indicator.
- **Retheme All Screens** — `/api/generate/retheme` endpoint that streams rethemed HTML for each generated UI shape.
- **Retheme button** — in design tokens editor with progress bar (1/N, 2/N...) and automatic `tokenHash` update.
- **Moodboard color extraction** — k-means clustering (`lib/color-extract.ts`) with `extractDominantColors()` and `mapColorsToTokenRoles()`.

---

### Edit Theme Popover

- **Light/Dark mode toggle** with instant background and text color swap.
- **8 accent color presets** — Coral, Amber, Rose, Blue, Emerald, Violet, Cyan, Fuchsia.
- **4 corner radius presets** — Sharp (4px), Soft (8px), Round (16px), Full (9999px) radius.
- **8 font pair presets** — Friendly, Elegant, Bold, Modern, Technical, Creative, Classic, Minimal.
- **Apply to All Screens** — persist theme changes to all generated UI screens.

---

### Version History

- **`StyleGuideSnapshot`** interface with id, name, timestamp, and complete guide state.
- **Snapshot reducers** — `saveSnapshot`, `restoreSnapshot`, `deleteSnapshot`, `renameSnapshot` with max 20 entries.
- **History panel** — in design tokens editor with name input, save button, scrollable snapshot list with relative timestamps, one-click restore/delete.

---

### Code Export

- **Framework code conversion** — Convert HTML+Tailwind to **React**, **Vue 3 SFC**, **Angular**, or **Svelte** components with streaming preview and copy-to-clipboard.
- **Dynamic Google Fonts URL generation** querying the project's actual fonts instead of hardcoded families in ZIP and HTML exports.
- **ZIP export** — package multiple screens as standalone HTML files.
- **HTML download** — individual screen export as standalone HTML with escaped filenames.

---

### Developer Experience

- **`AGENTS.md`** — operational guide for AI coding agents with MCP server priority and 3-tier rules of engagement.
- **`CLAUDE.md`** — Claude Code-specific onboarding with TypeScript strictness, design token rules, and quality gates.
- **System prompt** (`.agents/rules/system-prompt.md`) — mandatory pre-flight checklist with MCP server usage instructions.
- **4 modular skill files** — canvas-rendering, redux-state-management, design-system, ai-streaming-api.
- **`DESIGN.md`** — design system specification with YAML frontmatter schema.
- **Type-safe model selector** using `useAppDispatch` and capitalized notification toast names.
- **Clean compilation pipeline** with zero `any` assertions across key schemas and catch handlers.
- **Absolute imports** — `@/` path alias enforced throughout the codebase.
- **TypeScript strict mode** — zero tolerance for type errors with `npx tsc --noEmit` quality gate.
- **Logo, video demo, and framework recommendations** in the main documentation.

---

### Tech Stack

- **Next.js** 16.2.9 (App Router, Turbopack)
- **React** 19.2.7
- **Redux Toolkit** 2.12.0
- **Tailwind CSS** 4.3.0
- **Prisma** 7.8.0
- **TypeScript** 6.0.3
- **Vercel AI SDK** (streamText, generateText, Output.object)
- **Radix UI** primitives
- **Lucide React** icons
- **Sonner** toasts
