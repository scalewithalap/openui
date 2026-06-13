# DESIGN.md — OpenUI Design System Spec

This specification defines the default design tokens and formatting structures used by OpenUI's visual components and generated AI outputs.

## 🎨 Theme Presets

### Colors & Accents

OpenUI's theme engine defaults to the following hex variables for component generation.

- **Coral** (Default): `#db2800`
- **Amber**: `#F59E0B`
- **Rose**: `#F43F5E`
- **Blue**: `#3B82F6`
- **Emerald**: `#10B981`
- **Violet**: `#8B5CF6`
- **Cyan**: `#06B6D4`
- **Fuchsia**: `#D946EF`

**Backgrounds & Text (Light Mode)**

- Background: `#faf8f5`
- Text: `#2e2925`

**Backgrounds & Text (Dark Mode)**

- Background: `#121212`
- Text: `#f5f5f5`

### Typography & Font Pairings

OpenUI uses the following curated Google Font pairings for headings and body text:

- **Minimal**: Host Grotesk / DM Sans
- **Modern**: Inter / DM Sans
- **Elegant**: Playfair Display / Source Sans 3
- **Friendly**: Nunito / Open Sans
- **Technical**: JetBrains Mono / Inter
- **Creative**: Outfit / Plus Jakarta Sans
- **Classic**: Merriweather / Lato
- **Bold**: Space Grotesk / Work Sans

### Borders & Shapes

- **Sharp**: 4px radius
- **Soft**: 8px radius
- **Round**: 16px radius
- **Full**: 9999px (Pill) radius
- *Card Default Radius*: 18px

## 📥 Import / Export Format

The application parses and generates a `DESIGN.md` payload structured in the following manner. Agents should use this structure when analyzing uploaded design systems.

```markdown
name: OpenUI Theme
version: alpha
colors:
  primary: "#db2800"
  secondary: "#8a9a86"
  surface: "#faf8f5"
  on-surface: "#2e2925"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  info: "#3B82F6"
  surface-variant: "#ffffff"
  muted: "#f4f4f5"
  border: "#e4e4e7"
typography:
  headline-md:
    fontFamily: Host Grotesk
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 9999px
  md: 18px
spacing:
  base: 15px
borders:
  width: 1px
opacity:
  overlay: 0.5
shadows:
  sm: "0 1px 2px rgba(0,0,0,0.05)"
  md: "0 4px 6px rgba(0,0,0,0.07)"
  lg: "0 10px 15px rgba(0,0,0,0.1)"
  xl: "0 20px 25px rgba(0,0,0,0.15)"

# Design System Guidelines
(Markdown body outlining design constraints, do's and don'ts, used by the AI generation context)
```

---

## 🌓 Workspace Theming (Light & Dark Mode)

This section outlines the architecture, setup, and conventions for Workspace Theming (Light and Dark mode) inside the OpenUI application.

### 1. Theming Architecture Overview

OpenUI supports system-aware and manually-toggleable Light and Dark themes. Theming is implemented using:

- **`next-themes`**: A Next.js theme provider that injects a `dark` or `light` class onto the `<html>` root node.
- **Tailwind CSS v4 Custom Properties**: Uses CSS variables defined inside `app/globals.css` that dynamically change when the `.dark` class is applied.
- **Semantic CSS Classes**: All UI layout components use semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-card`, etc.) to automatically match the active mode.

### 2. The Core Technical Stack

* **Global Provider (`app/layout.tsx`)**: The `ThemeProvider` wraps the React node tree, targeting the HTML `class` attribute.
* **OKLCH Color Variables (`app/globals.css`)**: Defined inside `:root` (light cream background `#faf8f5` / charcoal text `#2e2925`) and `.dark` (dark cocoa-brown `#251f1c` / off-white `#f7f4f0`).

### 3. Interactive Theme Toggle (`components/navbar/theme-toggle.tsx`)

The `ThemeToggle` button uses the `useTheme` hook to read and dispatch theme state. To prevent SSR hydration mismatch warnings, it detects mounting client-side before rendering the interactive Sun/Moon icons.

### 4. Component Development Guidelines

- **Rely on Semantic Tokens**: Avoid hardcoding gray/white values (e.g. use `bg-card` instead of `bg-white`, `text-foreground` instead of `text-zinc-800`).
- **Canvas Isolation**: Workspace theming applies solely to the **editor shell**. The generated canvas components rendered inside iframes are styled dynamically by their own style guide state (`state.styleGuide.guide`) and do not inherit parent workspace themes.
