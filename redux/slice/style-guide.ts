import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  StyleGuide,
  ColorSection,
  TypographySection,
} from "../api/style-guide";

export interface DesignSystemDetails {
  cardRadius: number;
  buttonRadius: number;
  spacingUnit: number;
  designMd: string;
}

export interface ExtendedStyleGuide extends Omit<
  StyleGuide,
  "colorSections" | "typographySections"
> {
  colorSections: ColorSection[];
  typographySections: TypographySection[];
  designSystemDetails: DesignSystemDetails;
}

export type EditorMode = "visual" | "markdown" | "split";

export interface StyleGuideSnapshot {
  id: string;
  name: string;
  timestamp: number;
  guide: ExtendedStyleGuide;
}

interface StyleGuideState {
  guide: ExtendedStyleGuide | null;
  mode: EditorMode;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isTokensEditorOpen: boolean;
  snapshots: StyleGuideSnapshot[];
  maxSnapshots: number;
}

const defaultMarkdown = `# DESIGN.md — OpenUI Design System Spec

This specification defines the default design tokens and formatting structures used by OpenUI's visual components and generated AI outputs. 

## 🎨 Theme Presets

### Colors & Accents
OpenUI's theme engine defaults to the following hex variables for component generation.
- **Coral** (Default): \`#db2800\`
- **Amber**: \`#F59E0B\`
- **Rose**: \`#F43F5E\`
- **Blue**: \`#3B82F6\`
- **Emerald**: \`#10B981\`
- **Violet**: \`#8B5CF6\`
- **Cyan**: \`#06B6D4\`
- **Fuchsia**: \`#D946EF\`

**Backgrounds & Text (Light Mode)**
- Background: \`#faf8f5\`
- Text: \`#2e2925\`

**Backgrounds & Text (Dark Mode)**
- Background: \`#121212\`
- Text: \`#f5f5f5\`

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

The application parses and generates a \`DESIGN.md\` payload structured in the following manner. Agents should use this structure when analyzing uploaded design systems.

\`\`\`markdown
---
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
---

# Design System Guidelines
(Markdown body outlining design constraints, do's and don'ts, used by the AI generation context)
\`\`\`

---

## 🌓 Workspace Theming (Light & Dark Mode)

This section outlines the architecture, setup, and conventions for Workspace Theming (Light and Dark mode) inside the OpenUI application.

### 1. Theming Architecture Overview
OpenUI supports system-aware and manually-toggleable Light and Dark themes. Theming is implemented using:
- **\`next-themes\`**: A Next.js theme provider that injects a \`dark\` or \`light\` class onto the \`<html>\` root node.
- **Tailwind CSS v4 Custom Properties**: Uses CSS variables defined inside \`app/globals.css\` that dynamically change when the \`.dark\` class is applied.
- **Semantic CSS Classes**: All UI layout components use semantic Tailwind classes (\`bg-background\`, \`text-foreground\`, \`bg-card\`, etc.) to automatically match the active mode.

### 2. The Core Technical Stack
* **Global Provider (\`app/layout.tsx\`)**: The \`ThemeProvider\` wraps the React node tree, targeting the HTML \`class\` attribute.
* **OKLCH Color Variables (\`app/globals.css\`)**: Defined inside \`:root\` (light cream background \`#faf8f5\` / charcoal text \`#2e2925\`) and \`.dark\` (dark cocoa-brown \`#251f1c\` / off-white \`#f7f4f0\`).

### 3. Interactive Theme Toggle (\`components/navbar/theme-toggle.tsx\`)
The \`ThemeToggle\` button uses the \`useTheme\` hook to read and dispatch theme state. To prevent SSR hydration mismatch warnings, it detects mounting client-side before rendering the interactive Sun/Moon icons.

### 4. Component Development Guidelines
- **Rely on Semantic Tokens**: Avoid hardcoding gray/white values (e.g. use \`bg-card\` instead of \`bg-white\`, \`text-foreground\` instead of \`text-zinc-800\`).
- **Canvas Isolation**: Workspace theming applies solely to the **editor shell**. The generated canvas components rendered inside iframes are styled dynamically by their own style guide state (\`state.styleGuide.guide\`) and do not inherit parent workspace themes.
`;

export const defaultStyleGuide: ExtendedStyleGuide = {
  theme: "Warm Cream & Coral Theme",
  description:
    "Vibrant and encouraging brand style with warm beige backgrounds and coral accents.",
  colorSections: [
    {
      title: "Primary Colors",
      swatches: [
        {
          name: "Coral Accent",
          hexColor: "#db2800",
          description: "Primary brand color, buttons, and links.",
        },
        {
          name: "Warm Cream",
          hexColor: "#faf8f5",
          description: "Default background for containers and cards.",
        },
      ],
    },
    {
      title: "Secondary & Accent Colors",
      swatches: [
        {
          name: "Cocoa Dark",
          hexColor: "#2e2925",
          description: "Used for main text color, headings, and dark accents.",
        },
        {
          name: "Muted Sage",
          hexColor: "#8a9a86",
          description: "Secondary accent color.",
        },
      ],
    },
    {
      title: "Status & Feedback Colors",
      swatches: [
        {
          name: "Success",
          hexColor: "#10B981",
          description: "Success alerts & badges",
        },
        {
          name: "Warning",
          hexColor: "#F59E0B",
          description: "Warnings & pending states",
        },
        {
          name: "Error",
          hexColor: "#EF4444",
          description: "Errors & critical alerts",
        },
        {
          name: "Info",
          hexColor: "#3B82F6",
          description: "Information alerts & highlights",
        },
      ],
    },
    {
      title: "UI Component Colors",
      swatches: [
        {
          name: "Surface Variant",
          hexColor: "#ffffff",
          description: "Cards, side panels",
        },
        {
          name: "Muted Background",
          hexColor: "#f4f4f5",
          description: "Disabled items, gray bg",
        },
        {
          name: "Border Color",
          hexColor: "#e4e4e7",
          description: "Dividers, card outline",
        },
      ],
    },
  ],
  typographySections: [
    {
      title: "Headings",
      styles: [
        {
          name: "Headline",
          fontFamily: "Host Grotesk",
          fontSize: "32px",
          fontWeight: "700",
          lineHeight: "1.2",
        },
      ],
    },
    {
      title: "Body",
      styles: [
        {
          name: "Body Text",
          fontFamily: "DM Sans",
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "1.5",
        },
      ],
    },
  ],
  designSystemDetails: {
    cardRadius: 18,
    buttonRadius: 9999,
    spacingUnit: 15,
    designMd: defaultMarkdown,
  },
};

const initialState: StyleGuideState = {
  guide: null,
  mode: "visual",
  isLoading: false,
  isSaving: false,
  error: null,
  isTokensEditorOpen: false,
  snapshots: [],
  maxSnapshots: 20,
};

// Simple YAML parser for design tokens front matter
type YAMLValue = string | YAMLObject;
interface YAMLObject {
  [key: string]: YAMLValue;
}

export function parseYAML(yamlText: string): YAMLObject {
  const lines = yamlText.split("\n");
  const result: YAMLObject = {};
  const stack: { indent: number; obj: YAMLObject }[] = [{ indent: -1, obj: result }];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Calculate indent level
    const indent = line.length - line.trimStart().length;

    // Match key: value or key:
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

    // Pop stack to match current indentation level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const currentParent = stack[stack.length - 1].obj;

    if (val === "") {
      const newObj: YAMLObject = {};
      currentParent[key] = newObj;
      stack.push({ indent, obj: newObj });
    } else {
      currentParent[key] = val;
    }
  }
  return result;
}

// Converts style guide to markdown representation
export function generateMarkdownFromGuide(
  guide: ExtendedStyleGuide,
  customShadows?: { sm?: string; md?: string; lg?: string; xl?: string },
  customBorderWidth?: number,
  customOverlayOpacity?: number,
): string {
  const primaryColor =
    guide.colorSections.find((s) => s.title === "Primary Colors")?.swatches[0]
      ?.hexColor || "#db2800";
  const bgColor =
    guide.colorSections.find((s) => s.title === "Primary Colors")?.swatches[1]
      ?.hexColor || "#faf8f5";
  const textColor =
    guide.colorSections.find((s) => s.title === "Secondary & Accent Colors")
      ?.swatches[0]?.hexColor || "#2e2925";

  const headingFont =
    guide.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";
  const bodyFont =
    guide.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";

  const secondaryColor =
    guide.colorSections.find((s) => s.title === "Primary Colors")?.swatches[2]
      ?.hexColor ||
    guide.colorSections.find((s) => s.title === "Secondary & Accent Colors")
      ?.swatches[1]?.hexColor ||
    "#8a9a86";

  // Get semantic colors from colorSections
  const successColor =
    guide.colorSections
      .find((s) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw) => sw.name === "Success")?.hexColor || "#10B981";
  const warningColor =
    guide.colorSections
      .find((s) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw) => sw.name === "Warning")?.hexColor || "#F59E0B";
  const errorColor =
    guide.colorSections
      .find((s) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw) => sw.name === "Error")?.hexColor || "#EF4444";
  const infoColor =
    guide.colorSections
      .find((s) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw) => sw.name === "Info")?.hexColor || "#3B82F6";

  // Get surface variants from colorSections
  const surfaceColor =
    guide.colorSections
      .find((s) => s.title === "UI Component Colors")
      ?.swatches.find((sw) => sw.name === "Surface Variant")?.hexColor ||
    "#ffffff";
  const mutedColor =
    guide.colorSections
      .find((s) => s.title === "UI Component Colors")
      ?.swatches.find((sw) => sw.name === "Muted Background")?.hexColor ||
    "#f4f4f5";
  const borderColor =
    guide.colorSections
      .find((s) => s.title === "UI Component Colors")
      ?.swatches.find((sw) => sw.name === "Border Color")?.hexColor ||
    "#e4e4e7";

  // Parse existing YAML to preserve/default shadows and others if not passed
  let yamlData: any = {};
  if (guide.designSystemDetails.designMd) {
    try {
      const yamlMatch = guide.designSystemDetails.designMd.match(
        /^---\r?\n([\s\S]*?)\r?\n---/,
      );
      if (yamlMatch) {
        yamlData = parseYAML(yamlMatch[1]);
      }
    } catch (e) {
      console.warn("Failed to parse YAML during generation:", e);
    }
  }

  const sm =
    customShadows?.sm !== undefined
      ? customShadows.sm
      : yamlData.shadows?.sm || "0 1px 2px rgba(0,0,0,0.05)";
  const md =
    customShadows?.md !== undefined
      ? customShadows.md
      : yamlData.shadows?.md || "0 4px 6px rgba(0,0,0,0.07)";
  const lg =
    customShadows?.lg !== undefined
      ? customShadows.lg
      : yamlData.shadows?.lg || "0 10px 15px rgba(0,0,0,0.1)";
  const xl =
    customShadows?.xl !== undefined
      ? customShadows.xl
      : yamlData.shadows?.xl || "0 20px 25px rgba(0,0,0,0.15)";

  const borderWidth =
    customBorderWidth !== undefined
      ? customBorderWidth
      : yamlData.borders?.width
        ? parseInt(yamlData.borders.width, 10)
        : 1;
  const overlayOpacity =
    customOverlayOpacity !== undefined
      ? customOverlayOpacity
      : yamlData.opacity?.overlay
        ? parseFloat(yamlData.opacity.overlay)
        : 0.5;

  return `---
name: ${guide.theme || "OpenUI Design System"}
version: alpha
colors:
  primary: "${primaryColor}"
  secondary: "${secondaryColor}"
  surface: "${bgColor}"
  on-surface: "${textColor}"
  success: "${successColor}"
  warning: "${warningColor}"
  error: "${errorColor}"
  info: "${infoColor}"
  surface-variant: "${surfaceColor}"
  muted: "${mutedColor}"
  border: "${borderColor}"
typography:
  headline-md:
    fontFamily: ${headingFont}
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: ${bodyFont}
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: ${guide.designSystemDetails.buttonRadius}px
  md: ${guide.designSystemDetails.cardRadius}px
spacing:
  base: ${guide.designSystemDetails.spacingUnit}px
borders:
  width: ${borderWidth}px
opacity:
  overlay: ${overlayOpacity}
shadows:
  sm: "${sm}"
  md: "${md}"
  lg: "${lg}"
  xl: "${xl}"
---
# Design System

## Overview
${guide.description || "A cohesive design system generated for the project."}

## Colors
- **Primary Accent** (${primaryColor}): Main interactive elements and buttons.
- **Background Surface** (${bgColor}): Application container background.
- **On-Surface Text** (${textColor}): Primary content text color.

## Typography
- **Headings**: ${headingFont}
- **Body**: ${bodyFont}

## Shapes
- **Card Corners**: ${guide.designSystemDetails.cardRadius}px
- **Button Corners**: ${guide.designSystemDetails.buttonRadius}px

## Layout
- **Minimal Spacing**: ${guide.designSystemDetails.spacingUnit}px

## Do's and Don't's
- Do use the primary color only for the single most important action per screen
- Don't mix rounded and sharp corners in the same view
`;
}

// Parses markdown and updates style guide parameters
export function parseMarkdownToGuide(
  markdown: string,
  current: ExtendedStyleGuide,
): ExtendedStyleGuide {
  const result = JSON.parse(JSON.stringify(current)) as ExtendedStyleGuide;
  result.designSystemDetails.designMd = markdown;

  // Extract YAML front matter
  let yamlData: any = {};
  const yamlMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (yamlMatch) {
    try {
      yamlData = parseYAML(yamlMatch[1]);
    } catch (e) {
      console.warn("Failed to parse YAML front matter:", e);
    }
  }

  // Helper to parse dimensions like "18px" or "18"
  const parseDim = (val: any) => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  };

  // Helper to update or insert a swatch in a section
  const updateSwatch = (
    sectionTitle: string,
    swatchName: string,
    hexColor: string,
    defaultDesc: string,
  ) => {
    let section = result.colorSections.find((s) => s.title === sectionTitle);
    if (!section) {
      section = { title: sectionTitle as any, swatches: [] };
      result.colorSections.push(section);
    }
    let swatch = section.swatches.find(
      (sw) => sw.name.toLowerCase() === swatchName.toLowerCase(),
    );
    if (!swatch) {
      section.swatches.push({
        name: swatchName,
        hexColor: hexColor.toLowerCase(),
        description: defaultDesc,
      });
    } else {
      swatch.hexColor = hexColor.toLowerCase();
    }
  };

  // 1. Update colors
  const primaryColor =
    yamlData.colors?.primary || yamlData.colors?.["primary-accent"];
  if (primaryColor) {
    updateSwatch(
      "Primary Colors",
      "Coral Accent",
      primaryColor,
      "Primary brand color, buttons, and links.",
    );
  } else {
    const primaryMatch = markdown.match(
      /Primary Accent\*?:\s*(#[0-9a-fA-F]{6})/i,
    );
    if (primaryMatch) {
      updateSwatch(
        "Primary Colors",
        "Coral Accent",
        primaryMatch[1],
        "Primary brand color, buttons, and links.",
      );
    }
  }

  const bgColor = yamlData.colors?.surface || yamlData.colors?.background;
  if (bgColor) {
    updateSwatch(
      "Primary Colors",
      "Warm Cream",
      bgColor,
      "Default background for containers and cards.",
    );
  } else {
    const bgMatch = markdown.match(/Background\*?:\s*(#[0-9a-fA-F]{6})/i);
    if (bgMatch) {
      updateSwatch(
        "Primary Colors",
        "Warm Cream",
        bgMatch[1],
        "Default background for containers and cards.",
      );
    }
  }

  const textColor = yamlData.colors?.["on-surface"] || yamlData.colors?.text;
  if (textColor) {
    updateSwatch(
      "Secondary & Accent Colors",
      "Cocoa Dark",
      textColor,
      "Used for main text color, headings, and dark accents.",
    );
  } else {
    const textMatch = markdown.match(/Text\/Cocoa\*?:\s*(#[0-9a-fA-F]{6})/i);
    if (textMatch) {
      updateSwatch(
        "Secondary & Accent Colors",
        "Cocoa Dark",
        textMatch[1],
        "Used for main text color, headings, and dark accents.",
      );
    }
  }

  // Parse new semantic colors
  const successColor = yamlData.colors?.success;
  if (successColor) {
    updateSwatch(
      "Status & Feedback Colors",
      "Success",
      successColor,
      "Success alerts & badges",
    );
  }

  const warningColor = yamlData.colors?.warning;
  if (warningColor) {
    updateSwatch(
      "Status & Feedback Colors",
      "Warning",
      warningColor,
      "Warnings & pending states",
    );
  }

  const errorColor = yamlData.colors?.error;
  if (errorColor) {
    updateSwatch(
      "Status & Feedback Colors",
      "Error",
      errorColor,
      "Errors & critical alerts",
    );
  }

  const infoColor = yamlData.colors?.info;
  if (infoColor) {
    updateSwatch(
      "Status & Feedback Colors",
      "Info",
      infoColor,
      "Information alerts & highlights",
    );
  }

  const surfaceColor =
    yamlData.colors?.["surface-variant"] || yamlData.colors?.surfaceVariant;
  if (surfaceColor) {
    updateSwatch(
      "UI Component Colors",
      "Surface Variant",
      surfaceColor,
      "Cards, side panels",
    );
  }

  const mutedColor = yamlData.colors?.muted;
  if (mutedColor) {
    updateSwatch(
      "UI Component Colors",
      "Muted Background",
      mutedColor,
      "Disabled items, gray bg",
    );
  }

  const borderColor = yamlData.colors?.border;
  if (borderColor) {
    updateSwatch(
      "UI Component Colors",
      "Border Color",
      borderColor,
      "Dividers, card outline",
    );
  }

  // 2. Update fonts
  const headingFont =
    yamlData.typography?.["headline-md"]?.fontFamily ||
    yamlData.typography?.h1?.fontFamily ||
    yamlData.typography?.headings?.fontFamily;
  if (headingFont && result.typographySections[0]?.styles[0]) {
    result.typographySections[0].styles[0].fontFamily = headingFont.trim();
  } else {
    const headingMatch = markdown.match(/Headings\*?:\s*([a-zA-Z0-9\s\-_]+)/i);
    if (headingMatch && result.typographySections[0]?.styles[0]) {
      result.typographySections[0].styles[0].fontFamily =
        headingMatch[1].trim();
    }
  }

  const bodyFont =
    yamlData.typography?.["body-md"]?.fontFamily ||
    yamlData.typography?.body?.fontFamily;
  if (bodyFont && result.typographySections[1]?.styles[0]) {
    result.typographySections[1].styles[0].fontFamily = bodyFont.trim();
  } else {
    const bodyMatch = markdown.match(/Body\*?:\s*([a-zA-Z0-9\s\-_]+)/i);
    if (bodyMatch && result.typographySections[1]?.styles[0]) {
      result.typographySections[1].styles[0].fontFamily = bodyMatch[1].trim();
    }
  }

  // 3. Update details
  const cardRadius =
    parseDim(yamlData.rounded?.md) || parseDim(yamlData.rounded?.card);
  if (cardRadius !== undefined) {
    result.designSystemDetails.cardRadius = cardRadius;
  } else {
    const cardRadiusMatch = markdown.match(/Card Radius\*?:\s*(\d+)px/i);
    if (cardRadiusMatch) {
      result.designSystemDetails.cardRadius = parseInt(cardRadiusMatch[1], 10);
    }
  }

  const buttonRadius =
    parseDim(yamlData.rounded?.sm) || parseDim(yamlData.rounded?.button);
  if (buttonRadius !== undefined) {
    result.designSystemDetails.buttonRadius = buttonRadius;
  } else {
    const buttonRadiusMatch = markdown.match(/Button Radius\*?:\s*(\d+)px/i);
    if (buttonRadiusMatch) {
      result.designSystemDetails.buttonRadius = parseInt(
        buttonRadiusMatch[1],
        10,
      );
    }
  }

  const spacingUnit =
    parseDim(yamlData.spacing?.base) ||
    parseDim(yamlData.spacing?.md) ||
    parseDim(yamlData.spacing?.spacingUnit);
  if (spacingUnit !== undefined) {
    result.designSystemDetails.spacingUnit = spacingUnit;
  } else {
    const spacingMatch = markdown.match(/Minimal Spacing\*?:\s*(\d+)px/i);
    if (spacingMatch) {
      result.designSystemDetails.spacingUnit = parseInt(spacingMatch[1], 10);
    }
  }

  return result;
}

const styleGuideSlice = createSlice({
  name: "styleGuide",
  initialState,
  reducers: {
    loadStyleGuideStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loadStyleGuideSuccess: (
      state,
      action: PayloadAction<Partial<ExtendedStyleGuide> | null>,
    ) => {
      state.isLoading = false;
      if (action.payload) {
        state.guide = {
          ...defaultStyleGuide,
          ...action.payload,
          designSystemDetails: {
            ...defaultStyleGuide.designSystemDetails,
            ...(action.payload.designSystemDetails || {}),
          },
        } as ExtendedStyleGuide;
      } else {
        state.guide = defaultStyleGuide;
      }
      state.error = null;
    },
    loadStyleGuideFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateEditorMode: (state, action: PayloadAction<EditorMode>) => {
      state.mode = action.payload;
    },
    updateVisualTokens: (
      state,
      action: PayloadAction<
        Partial<{
          primaryColor: string;
          bgColor: string;
          textColor: string;
          headingFont: string;
          bodyFont: string;
          cardRadius: number;
          buttonRadius: number;
          spacingUnit: number;
          successColor: string;
          warningColor: string;
          errorColor: string;
          infoColor: string;
          surfaceColor: string;
          mutedColor: string;
          borderColor: string;
          shadowSm: string;
          shadowMd: string;
          shadowLg: string;
          shadowXl: string;
          borderWidth: number;
          overlayOpacity: number;
        }>
      >,
    ) => {
      if (!state.guide) return;
      const {
        primaryColor,
        bgColor,
        textColor,
        headingFont,
        bodyFont,
        cardRadius,
        buttonRadius,
        spacingUnit,
        successColor,
        warningColor,
        errorColor,
        infoColor,
        surfaceColor,
        mutedColor,
        borderColor,
        shadowSm,
        shadowMd,
        shadowLg,
        shadowXl,
        borderWidth,
        overlayOpacity,
      } = action.payload;

      // Helper to update or insert a swatch in a section
      const updateSwatch = (
        sectionTitle: string,
        swatchName: string,
        hexColor: string,
        defaultDesc: string,
      ) => {
        if (!state.guide) return;
        let section = state.guide.colorSections.find(
          (s) => s.title === sectionTitle,
        );
        if (!section) {
          section = { title: sectionTitle as any, swatches: [] };
          state.guide.colorSections.push(section);
        }
        let swatch = section.swatches.find(
          (sw) => sw.name.toLowerCase() === swatchName.toLowerCase(),
        );
        if (!swatch) {
          section.swatches.push({
            name: swatchName,
            hexColor,
            description: defaultDesc,
          });
        } else {
          swatch.hexColor = hexColor;
        }
      };

      // Update color swatches
      if (primaryColor)
        updateSwatch(
          "Primary Colors",
          "Coral Accent",
          primaryColor,
          "Primary brand color, buttons, and links.",
        );
      if (bgColor)
        updateSwatch(
          "Primary Colors",
          "Warm Cream",
          bgColor,
          "Default background for containers and cards.",
        );
      if (textColor)
        updateSwatch(
          "Secondary & Accent Colors",
          "Cocoa Dark",
          textColor,
          "Used for main text color, headings, and dark accents.",
        );

      if (successColor)
        updateSwatch(
          "Status & Feedback Colors",
          "Success",
          successColor,
          "Success alerts & badges",
        );
      if (warningColor)
        updateSwatch(
          "Status & Feedback Colors",
          "Warning",
          warningColor,
          "Warnings & pending states",
        );
      if (errorColor)
        updateSwatch(
          "Status & Feedback Colors",
          "Error",
          errorColor,
          "Errors & critical alerts",
        );
      if (infoColor)
        updateSwatch(
          "Status & Feedback Colors",
          "Info",
          infoColor,
          "Information alerts & highlights",
        );

      if (surfaceColor)
        updateSwatch(
          "UI Component Colors",
          "Surface Variant",
          surfaceColor,
          "Cards, side panels",
        );
      if (mutedColor)
        updateSwatch(
          "UI Component Colors",
          "Muted Background",
          mutedColor,
          "Disabled items, gray bg",
        );
      if (borderColor)
        updateSwatch(
          "UI Component Colors",
          "Border Color",
          borderColor,
          "Dividers, card outline",
        );

      // Update fonts
      if (headingFont && state.guide.typographySections[0]?.styles[0]) {
        state.guide.typographySections[0].styles[0].fontFamily = headingFont;
      }
      if (bodyFont && state.guide.typographySections[1]?.styles[0]) {
        state.guide.typographySections[1].styles[0].fontFamily = bodyFont;
      }

      // Update details
      if (cardRadius !== undefined) {
        state.guide.designSystemDetails.cardRadius = cardRadius;
      }
      if (buttonRadius !== undefined) {
        state.guide.designSystemDetails.buttonRadius = buttonRadius;
      }
      if (spacingUnit !== undefined) {
        state.guide.designSystemDetails.spacingUnit = spacingUnit;
      }

      // Regenerate markdown from updated visual guide, passing custom layout values
      state.guide.designSystemDetails.designMd = generateMarkdownFromGuide(
        state.guide,
        { sm: shadowSm, md: shadowMd, lg: shadowLg, xl: shadowXl },
        borderWidth,
        overlayOpacity,
      );
    },
    updateMarkdownText: (state, action: PayloadAction<string>) => {
      if (!state.guide) return;
      state.guide.designSystemDetails.designMd = action.payload;
    },
    syncMarkdownToTokens: (state) => {
      if (!state.guide) return;
      state.guide = parseMarkdownToGuide(
        state.guide.designSystemDetails.designMd,
        state.guide,
      );
    },
    saveStyleGuideStart: (state) => {
      state.isSaving = true;
    },
    saveStyleGuideSuccess: (state) => {
      state.isSaving = false;
    },
    saveStyleGuideFailure: (state, action: PayloadAction<string>) => {
      state.isSaving = false;
      state.error = action.payload;
    },
    openTokensEditor: (state) => {
      state.isTokensEditorOpen = true;
    },
    closeTokensEditor: (state) => {
      state.isTokensEditorOpen = false;
    },
    toggleTokensEditor: (state) => {
      state.isTokensEditorOpen = !state.isTokensEditorOpen;
    },

    // --- Snapshot History ---
    saveSnapshot: (state, action: PayloadAction<string>) => {
      if (!state.guide) return;
      const snapshot: StyleGuideSnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: action.payload || `Snapshot ${state.snapshots.length + 1}`,
        timestamp: Date.now(),
        guide: JSON.parse(JSON.stringify(state.guide)),
      };
      state.snapshots.unshift(snapshot);
      // Trim to max
      if (state.snapshots.length > state.maxSnapshots) {
        state.snapshots = state.snapshots.slice(0, state.maxSnapshots);
      }
    },
    restoreSnapshot: (state, action: PayloadAction<string>) => {
      const snapshot = state.snapshots.find((s) => s.id === action.payload);
      if (snapshot) {
        state.guide = JSON.parse(JSON.stringify(snapshot.guide));
      }
    },
    deleteSnapshot: (state, action: PayloadAction<string>) => {
      state.snapshots = state.snapshots.filter((s) => s.id !== action.payload);
    },
    renameSnapshot: (
      state,
      action: PayloadAction<{ id: string; name: string }>,
    ) => {
      const snapshot = state.snapshots.find((s) => s.id === action.payload.id);
      if (snapshot) {
        snapshot.name = action.payload.name;
      }
    },
  },
});

export const {
  loadStyleGuideStart,
  loadStyleGuideSuccess,
  loadStyleGuideFailure,
  updateEditorMode,
  updateVisualTokens,
  updateMarkdownText,
  syncMarkdownToTokens,
  saveStyleGuideStart,
  saveStyleGuideSuccess,
  saveStyleGuideFailure,
  openTokensEditor,
  closeTokensEditor,
  toggleTokensEditor,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  renameSnapshot,
} = styleGuideSlice.actions;

export default styleGuideSlice.reducer;
