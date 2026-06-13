---
name: design-system
description: Best practices for integrating design tokens, using the ExtendedStyleGuide type system, reading DESIGN.md frontmatter, managing theme presets, WCAG contrast checking, color extraction, and snapshot version history. Use when modifying visual themes, typography sets, exporting styling configs, or working with the AI theme generator.
---

# Design System Guidelines

OpenUI allows dynamic design systems injected at runtime via the `style-guide.ts` Redux slice.

## When to Use This Skill
- You are adding new Tailwind utility patterns.
- You are modifying `edit-theme-popover.tsx` or `design-tokens-editor.tsx`.
- You are reading/writing `DESIGN.md` representations.
- You are working with **theme presets**, **AI theme generation**, or **retheme** features.
- You are modifying the **WCAG contrast checker** or **color extraction** utilities.

## 1. Tailwind Usage Constraints

OpenUI relies entirely on **Vanilla Tailwind CSS v4**.
- Do not add external UI libraries for basic components (e.g. Bootstrap, Material). Use Radix UI primitives with Tailwind.
- Use arbitrary values sparingly. Rely on defined Tailwind scales (e.g. `p-4`, `w-12`, `gap-2`).
- Do not use inline `style={}` for properties supported by Tailwind.

## 2. The ExtendedStyleGuide Type System (CRITICAL)

The source of truth for the current canvas theme is `state.styleGuide.guide: ExtendedStyleGuide`.

### Key Interfaces
```typescript
interface ExtendedStyleGuide {
  theme?: string;
  description?: string;
  colorSections: ColorSection[];       // Dynamic array — NEVER assume fixed length
  typographySections: TypographySection[]; // Dynamic array
  designSystemDetails: DesignSystemDetails;
}

interface DesignSystemDetails {
  cardRadius: number;
  buttonRadius: number;
  spacingUnit: number;
  designMd: string;  // YAML frontmatter + markdown body
}
```

### Reading Tokens (Dynamic Resolution)
**NEVER** hardcode array indices for semantic meaning. Use `find()` by section title:

```typescript
// ✅ Correct — dynamic lookup by title
const primaryColor = guide?.colorSections
  .find((s: ColorSection) => s.title === "Primary Colors")
  ?.swatches[0]?.hexColor || "#db2800";

// ❌ Incorrect — assumes section order
const primaryColor = guide?.colorSections[0]?.swatches[0]?.hexColor;
```

### The 4 Standard Color Sections
1. **"Primary Colors"** — Primary accent + Background surface
2. **"Secondary & Accent Colors"** — Text color + Secondary accent
3. **"Status & Feedback Colors"** — Success, Warning, Error, Info
4. **"UI Component Colors"** — Surface Variant, Muted Background, Border Color

## 3. DESIGN.md YAML Frontmatter Schema

When an AI generates or parses a `DESIGN.md` file, ensure it adheres to the expanded YAML frontmatter schema:

```yaml
---
name: Theme Name
version: alpha
colors:
  primary: "#Hex"
  secondary: "#Hex"
  surface: "#Hex"
  on-surface: "#Hex"
  success: "#Hex"
  warning: "#Hex"
  error: "#Hex"
  info: "#Hex"
  surface-variant: "#Hex"
  muted: "#Hex"
  border: "#Hex"
typography:
  headline-md:
    fontFamily: Font Name
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: Font Name
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 8px
  md: 16px
spacing:
  base: 16px
borders:
  width: 1px
opacity:
  overlay: 0.5
shadows:
  sm: "0 1px 2px rgba(0,0,0,0.05)"
  md: "0 4px 6px rgba(0,0,0,0.07)"
  lg: "0 10px 15px rgba(0,0,0,0.1)"
  xl: "0 20px 25px rgba(0,0,0,0.15)"
---
```

Never alter `redux/slice/style-guide.ts`'s `parseYAML` or `parseMarkdownToGuide` functions without strictly updating this specification first.

## 4. Theme Presets (`lib/theme-presets.ts`)

10 curated presets are available: Midnight Blue, Forest, Sunset Warm, Corporate, Glassmorphism, Neon Pop, Pastel Dream, Earth Tone, Arctic, Monochrome.

Each preset is a complete `ExtendedStyleGuide` object built via the `makePreset()` helper. To add a new preset:
1. Call `makePreset(theme, description, colors, fonts, layout)`.
2. Include all 11 color values (primary, bg, text, accent, success, warning, error, info, surface, muted, border).
3. Use real Google Fonts families.

## 5. WCAG Contrast Checking

`lib/contrast.ts` provides:
- `checkContrast(fg: string, bg: string)` → `{ ratio, level: "AAA" | "AA" | "Fail", isValid }`
- `getContrastRecommendation(fg, bg)` → Human-readable guidance string

Always display contrast badges in the design tokens editor for text-on-background combinations.

## 6. Color Extraction (`lib/color-extract.ts`)

For moodboard color extraction:
- `extractDominantColors(imageUrls, numColors)` → `string[]` of hex colors
- `mapColorsToTokenRoles(hexColors)` → `{ primary, bg, text, accent, secondary }`

Uses k-means clustering with k-means++ seeding on canvas pixel samples.

## 7. Snapshot Version History

The style guide supports up to 20 named snapshots:
- `dispatch(saveSnapshot("v1 Dark"))` — Captures current guide state
- `dispatch(restoreSnapshot(id))` — Loads a snapshot back
- `dispatch(deleteSnapshot(id))` — Removes a snapshot
- `dispatch(renameSnapshot({ id, name }))` — Renames

Snapshots use `JSON.parse(JSON.stringify(guide))` for deep cloning to prevent Redux reference sharing.
