import { NextRequest, NextResponse } from "next/server";
import {
  getLanguageModel,
  getVisionLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { prisma } from "@/lib/db";
import { updateProjectStyleGuide } from "@/lib/db/projects";
import { prompts } from "@/prompts";
import { generateText, Output } from "ai";
import z from "zod";
import fs from "fs/promises";
import path from "path";

const ColorSwatchSchema = z.object({
  name: z.string(),
  hexColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be valid hex color"),
  description: z.string().optional(),
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
  letterSpacing: z.string().optional(),
  description: z.string().optional(),
});

const TypographySectionSchema = z.object({
  title: z.string(),
  styles: z.array(TypographyStyleSchema),
});

const StyleGuideSchema = z.object({
  theme: z.string(),
  description: z.string(),
  colorSections: z.array(ColorSectionSchema),
  typographySections: z.array(TypographySectionSchema),
});

function generateDesignSystemDetails(styleGuide: any) {
  // Extract primary color
  const primaryColor = styleGuide.colorSections?.[0]?.swatches?.[0]?.hexColor || "#db2800";
  
  // Extract background color
  let bgColor = "#faf8f5";
  if (styleGuide.colorSections) {
    for (const sec of styleGuide.colorSections) {
      for (const swatch of sec.swatches) {
        const desc = (swatch.description || "").toLowerCase();
        const name = (swatch.name || "").toLowerCase();
        if (desc.includes("background") || name.includes("background") || desc.includes("neutral") || name.includes("neutral") || name.includes("cream")) {
          bgColor = swatch.hexColor;
          break;
        }
      }
    }
  }
  if (bgColor === "#faf8f5" && styleGuide.colorSections?.[0]?.swatches?.[1]) {
    bgColor = styleGuide.colorSections[0].swatches[1].hexColor;
  }

  // Extract text/cocoa color
  let textColor = "#2e2925";
  if (styleGuide.colorSections) {
    for (const sec of styleGuide.colorSections) {
      for (const swatch of sec.swatches) {
        const desc = (swatch.description || "").toLowerCase();
        const name = (swatch.name || "").toLowerCase();
        if (desc.includes("text") || name.includes("text") || name.includes("dark") || name.includes("cocoa") || desc.includes("body")) {
          textColor = swatch.hexColor;
          break;
        }
      }
    }
  }
  if (textColor === "#2e2925" && styleGuide.colorSections?.[1]?.swatches?.[0]) {
    textColor = styleGuide.colorSections[1].swatches[0].hexColor;
  }

  // Extract fonts
  const headingFont = styleGuide.typographySections?.[0]?.styles?.[0]?.fontFamily || "Host Grotesk";
  const bodyFont = styleGuide.typographySections?.[1]?.styles?.[0]?.fontFamily || "DM Sans";

  // Default layout tokens
  const cardRadius = 16;
  const buttonRadius = 8;
  const spacingUnit = 16;

  // Secondary color
  let secondaryColor = "#8a9a86";
  if (styleGuide.colorSections?.[0]?.swatches?.[2]) {
    secondaryColor = styleGuide.colorSections[0].swatches[2].hexColor;
  } else if (styleGuide.colorSections?.[1]?.swatches?.[1]) {
    secondaryColor = styleGuide.colorSections[1].swatches[1].hexColor;
  }

  const designMd = `---
name: ${styleGuide.theme || "OpenUI Design System"}
version: alpha
colors:
  primary: "${primaryColor}"
  secondary: "${secondaryColor}"
  surface: "${bgColor}"
  on-surface: "${textColor}"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  info: "#3B82F6"
  surface-variant: "#ffffff"
  muted: "#f4f4f5"
  border: "#e4e4e7"
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
  sm: ${buttonRadius}px
  md: ${cardRadius}px
spacing:
  base: ${spacingUnit}px
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
${styleGuide.description || "A cohesive design system generated for the project."}

## Colors
- **Primary Accent** (${primaryColor}): Main interactive elements and buttons.
- **Background Surface** (${bgColor}): Application container background.
- **On-Surface Text** (${textColor}): Primary content text color.

## Typography
- **Headings**: ${headingFont}
- **Body**: ${bodyFont}

## Shapes
- **Card Corners**: ${cardRadius}px
- **Button Corners**: ${buttonRadius}px

## Layout
- **Minimal Spacing**: ${spacingUnit}px

## Do's and Don'ts
- Do use the primary color only for the single most important action per screen
- Don't mix rounded and sharp corners in the same view
`;

  return {
    cardRadius,
    buttonRadius,
    spacingUnit,
    designMd,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { settings: true, moodBoardImages: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.moodBoardImages || project.moodBoardImages.length === 0) {
      return NextResponse.json(
        {
          error:
            "No mood board images found. Please upload images to the mood board first.",
        },
        { status: 400 },
      );
    }



    // Load local moodboard images and convert to Uint8Array
    const visionImages: Array<{ type: "image"; image: Uint8Array }> = [];
    for (const img of project.moodBoardImages) {
      try {
        const absolutePath = path.join(
          process.cwd(),
          "data",
          "uploads",
          img.filePath,
        );
        const fileBuffer = await fs.readFile(absolutePath);
        visionImages.push({
          type: "image" as const,
          image: new Uint8Array(fileBuffer),
        });
      } catch (err) {
        console.warn(
          "Failed to read moodboard image for AI:",
          img.filePath,
          err,
        );
      }
    }

    // Resolve model based on presence of image input
    const hasImages = visionImages.length > 0;
    let model;
    try {
      const settings = project.settings;
      if (settings?.provider && settings?.model) {
        if (hasImages) {
          model = getVisionLanguageModel(
            settings.provider as ProviderKey,
            settings.model,
          );
        } else {
          model = getLanguageModel(
            settings.provider as ProviderKey,
            settings.model,
          );
        }
      } else {
        model = getFallbackModel();
      }
    } catch (err) {
      console.warn("Failed to resolve project model, using fallback:", err);
      model = getFallbackModel();
    }

    const systemPrompt = prompts.styleGuide.system;

    const userPrompt = `Analyze these ${visionImages.length} mood board images and generate a design system:
Extract colors that work harmoniously together and create typography that matches the aesthetic.
Return ONLY the JSON object matching the exact schema structure above.`;

    const result = await generateText({
      model: model as Parameters<typeof generateText>[0]["model"],
      output: Output.object({ schema: StyleGuideSchema }),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            ...visionImages,
          ],
        },
      ],
    });

    const styleGuideData = {
      ...result.output,
      designSystemDetails: generateDesignSystemDetails(result.output),
    };

    await updateProjectStyleGuide(projectId, styleGuideData);

    return NextResponse.json({
      success: true,
      styleGuide: styleGuideData,
      message: "Style guide generated successfully",
    });
  } catch (error) {
    console.error("Error generating style guide:", error);
    return NextResponse.json(
      {
        error: "Failed to generate style guide",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
