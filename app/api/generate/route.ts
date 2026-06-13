import { prompts, deviceContexts } from "@/prompts";
import {
  getLanguageModel,
  getVisionLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { createStreamResponse } from "@/lib/ai/route-utils";
import { prisma } from "@/lib/db";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const projectId = formData.get("projectId") as string;
    const prompt = (formData.get("prompt") as string) || "";
    const deviceType = (formData.get("deviceType") as string) || "custom";
    const includeDrawingStr = (formData.get("includeDrawing") as string) || "false";
    const includeDrawing = includeDrawingStr === "true";
    const selectedImageIdsStr = (formData.get("selectedImageIds") as string) || "[]";
    const temperatureStr = (formData.get("temperature") as string) || "0.7";
    const temperature = Math.min(1.5, Math.max(0.1, parseFloat(temperatureStr) || 0.7));
    const variantIndex = parseInt((formData.get("variantIndex") as string) || "0", 10);
    const variantCountTotal = parseInt((formData.get("variantCount") as string) || "1", 10);
    const streamId = (formData.get("streamId") as string) || "gen-ui";

    let selectedImageIds: string[] = [];
    try {
      selectedImageIds = JSON.parse(selectedImageIdsStr);
    } catch (e) {
      console.warn("Failed to parse selectedImageIds:", e);
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "No projectId provided!" },
        { status: 400 },
      );
    }

    if (includeDrawing && !imageFile) {
      return NextResponse.json(
        { error: "No image file provided when drawing context is selected!" },
        { status: 400 },
      );
    }

    // Validate file type if file is present
    if (imageFile && !imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }

    const imageBuffer = imageFile ? await imageFile.arrayBuffer() : null;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { settings: true, inspirationImages: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found!" },
        { status: 404 },
      );
    }



    // Read style guide and Design.md
    const guide = project.styleGuide
      ? JSON.parse(project.styleGuide)
      : null;

    const colors = guide?.colorSections || [];
    const typography = guide?.typographySections || [];
    const designMd = guide?.designSystemDetails?.designMd || "";

    // Load local inspiration images and convert to Uint8Array (filtered by selectedImageIds)
    const visionImages: Array<{ type: "image"; image: Uint8Array }> = [];
    for (const img of project.inspirationImages) {
      // If user selected specific images, filter by them
      if (selectedImageIds.length > 0 && !selectedImageIds.includes(img.id)) {
        continue;
      }
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
          "Failed to read inspiration image for AI:",
          img.filePath,
          err,
        );
      }
    }

    // Resolve model based on presence of image input
    const hasImages = !!imageBuffer || visionImages.length > 0;
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
        console.warn(`[Generate] project.settings is missing or incomplete. Settings: ${JSON.stringify(settings)}`);
        model = getFallbackModel();
      }
    } catch (err) {
      console.warn("[Generate] Failed to resolve project model, using fallback. Error details:", err);
      model = getFallbackModel();
    }

    const systemPrompt = prompts.generativeUi.system;

    // Add variant diversity instruction for non-first variants
    const variantDiversityPrompt = variantIndex > 0
      ? `\n\nIMPORTANT: This is variant #${variantIndex + 1} of ${variantCountTotal}. Generate a DISTINCTLY DIFFERENT layout variation from the other variants. Explore alternative:\n- Component arrangements and visual hierarchies\n- Layout patterns (grid vs stack vs sidebar vs split)\n- Spacing rhythms and section ordering\n- Visual weight distribution\nMaintain the same content requirements and style system, but create a unique structural interpretation.`
      : "";

    const styleConstraints = designMd
      ? `Follow this DESIGN.md specification strictly for spacing units, font sizes, colors, and border-radii:\n${designMd}`
      : `Use the user-provided styleGuide colors and typography for all visual decisions:
         colors: ${colors.map((color: any) => color.swatches.map((swatch: any) => `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`).join(", ")).join("; ")}
         typography: ${typography.map((typo: any) => typo.styles.map((style: any) => `${style.name}: ${style.fontFamily}, size ${style.fontSize}`).join(", ")).join("; ")}
         enforce WCAG AA contrast (>=4.5:1), and if any token is missing fall back to neutral light defaults.`;

    const deviceContext = deviceContexts[deviceType] || "";

    const userPrompt = `
Generate a fully responsive UI layout corresponding to the specifications below:

1. Device Target Layout:
   - Screen Viewport: ${deviceType.toUpperCase()}
   - Ensure the layout is designed specifically for a ${deviceType} screen size (e.g. mobile stacking and small-screen layouts vs desktop spacing, sidebars, and grids).
   ${deviceContext ? `- Device-specific layout rules:\n${deviceContext}` : ""}

2. User Prompt Instruction:
   - Required Layout Content: "${prompt || "Generate a modern interface based on style system."}"

3. Style Guide & Design Tokens (DESIGN.md):
   - ${styleConstraints}

4. Reference Images:
   - Use the attached design reference images ONLY for visual style interpretation (overall layout spacing structure, component ideas, mood, accent placements) to bias visual choices within the style tokens above.
   - Do NOT extract new colors or fonts not defined in the Style System.
   - Design System / DESIGN.md rules always override conflicting cues in the images.
`;

    const messagesContent: Array<{ type: "text"; text: string } | { type: "image"; image: Uint8Array }> = [
      {
        type: "text",
        text: userPrompt,
      },
    ];

    if (imageBuffer) {
      messagesContent.push({
        type: "image",
        image: new Uint8Array(imageBuffer),
      });
    }

    // Add selected visionImages
    messagesContent.push(...visionImages);

    const result = streamText({
      model: model as Parameters<typeof streamText>[0]["model"],
      messages: [
        {
          role: "user",
          content: messagesContent,
        },
      ],
      system: systemPrompt + variantDiversityPrompt,
      temperature: temperature,
    });

    return createStreamResponse(result.textStream, "text/event-stream; charset=utf-8", streamId);
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate UI Design.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
