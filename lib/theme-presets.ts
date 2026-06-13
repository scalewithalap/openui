import type { ExtendedStyleGuide } from "@/redux/slice/style-guide";

/**
 * 10 curated design system presets with complete token sets.
 * Each includes primary, secondary, status, and UI component colors,
 * typography, and layout tokens.
 */

function makePreset(
  theme: string,
  description: string,
  colors: {
    primary: string; bg: string; text: string; accent: string;
    success?: string; warning?: string; error?: string; info?: string;
    surface?: string; muted?: string; border?: string;
  },
  fonts: { heading: string; body: string },
  layout: { cardRadius: number; buttonRadius: number; spacingUnit: number }
): ExtendedStyleGuide {
  return {
    theme,
    description,
    colorSections: [
      {
        title: "Primary Colors",
        swatches: [
          { name: "Primary", hexColor: colors.primary, description: "Primary brand color, buttons, and links." },
          { name: "Background", hexColor: colors.bg, description: "Default background for containers and cards." },
        ],
      },
      {
        title: "Secondary & Accent Colors",
        swatches: [
          { name: "Text", hexColor: colors.text, description: "Used for main text color and headings." },
          { name: "Accent", hexColor: colors.accent, description: "Secondary accent color." },
        ],
      },
      {
        title: "Status & Feedback Colors",
        swatches: [
          { name: "Success", hexColor: colors.success || "#10B981", description: "Success alerts & badges" },
          { name: "Warning", hexColor: colors.warning || "#F59E0B", description: "Warnings & pending states" },
          { name: "Error", hexColor: colors.error || "#EF4444", description: "Errors & critical alerts" },
          { name: "Info", hexColor: colors.info || "#3B82F6", description: "Information alerts & highlights" },
        ],
      },
      {
        title: "UI Component Colors",
        swatches: [
          { name: "Surface Variant", hexColor: colors.surface || "#ffffff", description: "Cards, side panels" },
          { name: "Muted Background", hexColor: colors.muted || "#f4f4f5", description: "Disabled items, gray bg" },
          { name: "Border Color", hexColor: colors.border || "#e4e4e7", description: "Dividers, card outline" },
        ],
      },
    ],
    typographySections: [
      {
        title: "Headings",
        styles: [{ name: "Headline", fontFamily: fonts.heading, fontSize: "32px", fontWeight: "700", lineHeight: "1.2" }],
      },
      {
        title: "Body",
        styles: [{ name: "Body Text", fontFamily: fonts.body, fontSize: "16px", fontWeight: "400", lineHeight: "1.5" }],
      },
    ],
    designSystemDetails: {
      ...layout,
      designMd: `---
name: ${theme}
version: alpha
colors:
  primary: "${colors.primary}"
  secondary: "${colors.accent}"
  surface: "${colors.bg}"
  on-surface: "${colors.text}"
  success: "${colors.success || "#10B981"}"
  warning: "${colors.warning || "#F59E0B"}"
  error: "${colors.error || "#EF4444"}"
  info: "${colors.info || "#3B82F6"}"
  surface-variant: "${colors.surface || "#ffffff"}"
  muted: "${colors.muted || "#f4f4f5"}"
  border: "${colors.border || "#e4e4e7"}"
typography:
  headline-md:
    fontFamily: ${fonts.heading}
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: ${fonts.body}
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: ${layout.buttonRadius}px
  md: ${layout.cardRadius}px
spacing:
  base: ${layout.spacingUnit}px
---
# ${theme}

## Overview
${description}
`,
    },
  };
}

export const themePresets: ExtendedStyleGuide[] = [
  // 1. Midnight Blue
  makePreset(
    "Midnight Blue",
    "Dark navy backgrounds with electric blue accents — perfect for dashboards and data-heavy interfaces.",
    { primary: "#3b82f6", bg: "#0f172a", text: "#e2e8f0", accent: "#60a5fa", success: "#22c55e", warning: "#eab308", error: "#ef4444", info: "#38bdf8", surface: "#1e293b", muted: "#334155", border: "#475569" },
    { heading: "Space Grotesk", body: "Inter" },
    { cardRadius: 12, buttonRadius: 8, spacingUnit: 16 }
  ),

  // 2. Forest
  makePreset(
    "Forest",
    "Deep greens and warm wood tones — organic, grounded, and calming.",
    { primary: "#166534", bg: "#fefdf8", text: "#1a2e1a", accent: "#a3b18a", success: "#22c55e", warning: "#ca8a04", error: "#dc2626", info: "#0891b2", surface: "#f7f5f0", muted: "#ecebe4", border: "#d4d3cc" },
    { heading: "Playfair Display", body: "Lora" },
    { cardRadius: 16, buttonRadius: 12, spacingUnit: 18 }
  ),

  // 3. Sunset Warm
  makePreset(
    "Sunset Warm",
    "Orange and coral gradients with creamy whites — energetic and optimistic.",
    { primary: "#ea580c", bg: "#fffbf5", text: "#431407", accent: "#fb923c", success: "#16a34a", warning: "#d97706", error: "#e11d48", info: "#2563eb", surface: "#fff7ed", muted: "#fed7aa", border: "#fdba74" },
    { heading: "Outfit", body: "DM Sans" },
    { cardRadius: 20, buttonRadius: 9999, spacingUnit: 16 }
  ),

  // 4. Corporate
  makePreset(
    "Corporate",
    "Clean grays with professional blue — trustworthy, polished, enterprise-grade.",
    { primary: "#1d4ed8", bg: "#f8fafc", text: "#1e293b", accent: "#64748b", success: "#059669", warning: "#d97706", error: "#dc2626", info: "#2563eb", surface: "#ffffff", muted: "#f1f5f9", border: "#e2e8f0" },
    { heading: "Inter", body: "Inter" },
    { cardRadius: 8, buttonRadius: 6, spacingUnit: 16 }
  ),

  // 5. Glassmorphism
  makePreset(
    "Glassmorphism",
    "Translucent whites and soft shadows on cool-toned backgrounds — modern and airy.",
    { primary: "#8b5cf6", bg: "#f0f4ff", text: "#1e1b4b", accent: "#a78bfa", success: "#34d399", warning: "#fbbf24", error: "#f87171", info: "#60a5fa", surface: "#ffffff", muted: "#eef2ff", border: "#c7d2fe" },
    { heading: "Sora", body: "Inter" },
    { cardRadius: 24, buttonRadius: 16, spacingUnit: 20 }
  ),

  // 6. Neon Pop
  makePreset(
    "Neon Pop",
    "Dark backgrounds with vibrant neon accents — electric, bold, cyberpunk-inspired.",
    { primary: "#00ff88", bg: "#0a0a0a", text: "#f0f0f0", accent: "#ff00ff", success: "#00ff88", warning: "#ffff00", error: "#ff3366", info: "#00ccff", surface: "#1a1a2e", muted: "#16213e", border: "#2d2d44" },
    { heading: "Orbitron", body: "Space Mono" },
    { cardRadius: 4, buttonRadius: 4, spacingUnit: 16 }
  ),

  // 7. Pastel Dream
  makePreset(
    "Pastel Dream",
    "Soft pinks and lavenders — gentle, whimsical, and inviting.",
    { primary: "#ec4899", bg: "#fdf2f8", text: "#4a1942", accent: "#a855f7", success: "#4ade80", warning: "#fbbf24", error: "#f43f5e", info: "#818cf8", surface: "#fce7f3", muted: "#f5d0fe", border: "#f0abfc" },
    { heading: "Poppins", body: "Nunito" },
    { cardRadius: 20, buttonRadius: 9999, spacingUnit: 18 }
  ),

  // 8. Earth Tone
  makePreset(
    "Earth Tone",
    "Browns, tans, and olive greens — warm, natural, and rustic.",
    { primary: "#92400e", bg: "#faf5ee", text: "#3d2e1e", accent: "#a3a263", success: "#65a30d", warning: "#b45309", error: "#b91c1c", info: "#0e7490", surface: "#f5f0e8", muted: "#e8e0d5", border: "#d6cfc5" },
    { heading: "Bitter", body: "Source Sans 3" },
    { cardRadius: 10, buttonRadius: 8, spacingUnit: 16 }
  ),

  // 9. Arctic
  makePreset(
    "Arctic",
    "Ice blue and silver on crisp white — clean, precise, and minimal.",
    { primary: "#0ea5e9", bg: "#f0f9ff", text: "#0c4a6e", accent: "#94a3b8", success: "#14b8a6", warning: "#f59e0b", error: "#ef4444", info: "#38bdf8", surface: "#ffffff", muted: "#e0f2fe", border: "#bae6fd" },
    { heading: "Manrope", body: "IBM Plex Sans" },
    { cardRadius: 12, buttonRadius: 8, spacingUnit: 16 }
  ),

  // 10. Monochrome
  makePreset(
    "Monochrome",
    "Pure black, white, and grayscale — timeless, editorial, and focused on content.",
    { primary: "#171717", bg: "#fafafa", text: "#171717", accent: "#737373", success: "#16a34a", warning: "#ca8a04", error: "#dc2626", info: "#2563eb", surface: "#ffffff", muted: "#f5f5f5", border: "#d4d4d4" },
    { heading: "DM Serif Display", body: "DM Sans" },
    { cardRadius: 0, buttonRadius: 0, spacingUnit: 20 }
  ),
];
