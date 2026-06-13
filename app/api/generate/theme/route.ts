import { NextRequest, NextResponse } from "next/server";
import {
  getLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { prisma } from "@/lib/db";
import { generateText, Output } from "ai";
import z from "zod";

const ColorSwatchSchema = z.object({
  name: z.string(),
  hexColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be valid hex color"),
  description: z.string(),
});

const ColorSectionSchema = z.object({
  title: z.string(),
  swatches: z.array(ColorSwatchSchema),
});

const TypographyStyleSchema = z.object({
  name: z.string(),
  fontFamily: z.string(),
  fontSize: z.string(),
  fontWeight: z.string(),
  lineHeight: z.string(),
});

const TypographySectionSchema = z.object({
  title: z.string(),
  styles: z.array(TypographyStyleSchema),
});

const ThemeSchema = z.object({
  theme: z.string(),
  description: z.string(),
  colorSections: z.array(ColorSectionSchema),
  typographySections: z.array(TypographySectionSchema),
  designSystemDetails: z.object({
    cardRadius: z.number(),
    buttonRadius: z.number(),
    spacingUnit: z.number(),
  }),
});

const SYSTEM_PROMPT = `You are a world-class UI/UX design system architect. Given a text prompt describing a visual style, aesthetic, or mood, generate a complete design system.

Your response MUST follow this structure exactly:
- theme: A descriptive name for the design system.
- description: A 1-2 sentence summary of the aesthetic.
- colorSections: An array of color groups. You MUST include these 4 sections:
  1. "Primary Colors" — 2 swatches: main accent + background surface
  2. "Secondary & Accent Colors" — 2 swatches: text color + secondary accent
  3. "Status & Feedback Colors" — 4 swatches: Success, Warning, Error, Info
  4. "UI Component Colors" — 3 swatches: Surface Variant, Muted Background, Border Color
- typographySections: 2 groups: "Headings" (1 style) and "Body" (1 style). Use real Google Fonts families (Inter, Outfit, DM Sans, Space Grotesk, Poppins, Playfair Display, Manrope, Sora, etc.)
- designSystemDetails: { cardRadius (px), buttonRadius (px), spacingUnit (px) }

CRITICAL: All hex colors must be valid 6-digit hex codes (#RRGGBB). Choose colors that are visually harmonious, have good contrast ratios (WCAG AA minimum), and match the requested aesthetic.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, projectId } = body;

    if (!prompt || !projectId) {
      return NextResponse.json(
        { error: "Both 'prompt' and 'projectId' are required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { settings: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

    const result = await generateText({
      model: model as Parameters<typeof generateText>[0]["model"],
      output: Output.object({ schema: ThemeSchema }),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate a complete design system for this visual style: "${prompt}"`,
        },
      ],
    });

    const themeData = result.output;

    // Build designMd from the generated theme
    const primaryColor = themeData.colorSections[0]?.swatches[0]?.hexColor || "#db2800";
    const bgColor = themeData.colorSections[0]?.swatches[1]?.hexColor || "#faf8f5";
    const textColor = themeData.colorSections[1]?.swatches[0]?.hexColor || "#2e2925";
    const secondaryColor = themeData.colorSections[1]?.swatches[1]?.hexColor || "#8a9a86";
    const headingFont = themeData.typographySections[0]?.styles[0]?.fontFamily || "Inter";
    const bodyFont = themeData.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";

    const statusSection = themeData.colorSections.find(s => s.title === "Status & Feedback Colors");
    const uiSection = themeData.colorSections.find(s => s.title === "UI Component Colors");

    const designMd = `---
name: ${themeData.theme}
version: alpha
colors:
  primary: "${primaryColor}"
  secondary: "${secondaryColor}"
  surface: "${bgColor}"
  on-surface: "${textColor}"
  success: "${statusSection?.swatches.find(s => s.name === "Success")?.hexColor || "#10B981"}"
  warning: "${statusSection?.swatches.find(s => s.name === "Warning")?.hexColor || "#F59E0B"}"
  error: "${statusSection?.swatches.find(s => s.name === "Error")?.hexColor || "#EF4444"}"
  info: "${statusSection?.swatches.find(s => s.name === "Info")?.hexColor || "#3B82F6"}"
  surface-variant: "${uiSection?.swatches.find(s => s.name === "Surface Variant")?.hexColor || "#ffffff"}"
  muted: "${uiSection?.swatches.find(s => s.name === "Muted Background")?.hexColor || "#f4f4f5"}"
  border: "${uiSection?.swatches.find(s => s.name === "Border Color")?.hexColor || "#e4e4e7"}"
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
  sm: ${themeData.designSystemDetails.buttonRadius}px
  md: ${themeData.designSystemDetails.cardRadius}px
spacing:
  base: ${themeData.designSystemDetails.spacingUnit}px
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
# Design System

## Overview
${themeData.description}

## Colors
- **Primary Accent** (${primaryColor}): Main interactive elements and buttons.
- **Background Surface** (${bgColor}): Application container background.
- **On-Surface Text** (${textColor}): Primary content text color.

## Typography
- **Headings**: ${headingFont}
- **Body**: ${bodyFont}

## Shapes
- **Card Corners**: ${themeData.designSystemDetails.cardRadius}px
- **Button Corners**: ${themeData.designSystemDetails.buttonRadius}px

## Layout
- **Minimal Spacing**: ${themeData.designSystemDetails.spacingUnit}px
`;

    const fullStyleGuide = {
      ...themeData,
      designSystemDetails: {
        ...themeData.designSystemDetails,
        designMd,
      },
    };

    return NextResponse.json({
      success: true,
      styleGuide: fullStyleGuide,
    });
  } catch (error) {
    console.error("Error generating theme:", error);
    return NextResponse.json(
      {
        error: "Failed to generate theme",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
