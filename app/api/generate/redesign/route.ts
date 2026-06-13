import { NextRequest, NextResponse } from "next/server";
import {
  getLanguageModel,
  getVisionLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { createStreamResponse } from "@/lib/ai/route-utils";
import { prisma } from "@/lib/db";
import { streamText } from "ai";
import { prompts } from "@/prompts";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userMessage,
      generatedUIId,
      currentHTML,
      wireframeSnapshot,
      projectId,
      streamId,
    } = body;
    const activeStreamId = streamId || generatedUIId;

    if (!userMessage || !generatedUIId || !projectId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: userMessage, generatedUIId, & projectId!",
        },
        { status: 400 },
      );
    }

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



    // Read style guide
    const guide = project.styleGuide
      ? JSON.parse(project.styleGuide)
      : { colorSections: [], typographySections: [] };

    const colors = guide.colorSections || [];
    const typography = guide.typographySections || [];

    // Load local inspiration images and convert to Uint8Array
    const visionImages: Array<{ type: "image"; image: Uint8Array }> = [];
    for (const img of project.inspirationImages) {
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

    // Build the user prompt for redesign
    let userPrompt = `Please redesign this UI based on my request: "${userMessage}"`;

    if (currentHTML) {
      userPrompt += `\n\nCurrent HTML for reference:\n${currentHTML.substring(
        0,
        3000,
      )}...`;
    }

    if (wireframeSnapshot) {
      userPrompt += `\n\nWireframe Context: I'm providing a wireframe image that shows the EXACT original design layout and structure that this UI was generated from. This wireframe represents the specific frame that was used to create the current design. Please use this as visual context to understand the intended layout, structure, and design elements when making improvements. The wireframe shows the original wireframe/mockup that the user drew or created.`;
    }

    if (colors.length > 0) {
      userPrompt += `\n\nStyle Guide Colors:\n${(
        colors as Array<{
          swatches: Array<{
            name: string;
            hexColor: string;
            description: string;
          }>;
        }>
      )
        .map((color) =>
          color.swatches
            .map(
              (swatch) =>
                `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`,
            )
            .join(", "),
        )
        .join(", ")}`;
    }

    if (typography.length > 0) {
      userPrompt += `\n\nTypography:\n${(
        typography as Array<{
          styles: Array<{
            name: string;
            description: string;
            fontFamily: string;
            fontWeight: string;
            fontSize: string;
            lineHeight: string;
          }>;
        }>
      )
        .map((typo) =>
          typo.styles
            .map(
              (style) =>
                `${style.name}: ${style.description}, ${style.fontFamily}, ${style.fontWeight}, ${style.fontSize}, ${style.lineHeight}`,
            )
            .join(", "),
        )
        .join(", ")}`;
    }

    userPrompt += `\n\nPlease generate a completely new HTML design based on my request while following the style guide, maintaining professional quality, and considering the wireframe context for layout understanding.`;

    // Process wireframe snapshot if available
    let wireframeImage = null;
    if (wireframeSnapshot) {
      const rawBase64 = wireframeSnapshot.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      wireframeImage = new Uint8Array(Buffer.from(rawBase64, "base64"));
    }

    const messagesContent: Array<{ type: "text"; text: string } | { type: "image"; image: Uint8Array }> = [
      {
        type: "text",
        text: userPrompt,
      },
    ];

    if (wireframeImage) {
      messagesContent.push({
        type: "image",
        image: wireframeImage,
      });
    }

    messagesContent.push(...visionImages);

    // Resolve model based on presence of image input
    const hasImages = visionImages.length > 0 || !!wireframeImage;
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

    const result = streamText({
      model: model as Parameters<typeof streamText>[0]["model"],
      messages: [
        {
          role: "user",
          content: messagesContent,
        },
      ],
      system: prompts.generativeUi.system,
      temperature: 0.7,
    });

    return createStreamResponse(result.textStream, "text/event-stream; charset=utf-8", activeStreamId);
  } catch (error) {
    console.error("Redesign API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process redesign request!",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
