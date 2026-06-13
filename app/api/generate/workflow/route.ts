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
    const { generatedUIId, currentHTML, projectId, pageIndex, streamId } = body;
    const activeStreamId = streamId || generatedUIId;

    if (
      !generatedUIId ||
      !currentHTML ||
      !projectId ||
      pageIndex === undefined
    ) {
      // M5: Log only field presence, not full content
      console.log("Missing fields:", {
        hasGeneratedUIId: !!generatedUIId,
        hasCurrentHTML: !!currentHTML,
        hasProjectId: !!projectId,
        pageIndex,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: generatedUIId, currentHTML, projectId & pageIndex!",
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

    // Define the page types for dynamic generation
    const pageTypes = [
      "Dashboard/Analytics page with charts, metrics, and KPIs",
      "Settings/Configuration page with preferences and account management",
      "User Profile page with personal information and activity",
      "Data Listing/Table page with search, filters, and pagination",
    ];

    const selectedPageType = pageTypes[pageIndex] || pageTypes[0];

    let userPrompt = `You are tasked with creating a workflow page that complements the provided main page design. 

MAIN PAGE REFERENCE (for design consistency):
${currentHTML.substring(0, 3000)}...

WORKFLOW PAGE TO GENERATE:
Create a "${selectedPageType}" that would logically complement the main page shown above.

DYNAMIC PAGE REQUIREMENTS:
1. Analyze the main page design and determine what type of application this appears to be
2. Based on that analysis, create a fitting ${selectedPageType} that would make sense in this application context
3. The page should feel like a natural extension of the main page's functionality
4. Use your best judgment to determine appropriate content, features, and layout for this page type

DESIGN CONSISTENCY REQUIREMENTS:
1. Use the EXACT same visual style, color scheme, and typography as the main page
2. Maintain identical component styling (buttons, cards, forms, navigation, etc.)
3. Keep the same overall layout structure and spacing patterns  
4. Use similar UI patterns and component hierarchy
5. Ensure the page feels like it belongs to the same application - perfect visual consistency

TECHNICAL REQUIREMENTS:
1. Generate clean, semantic HTML with Tailwind CSS classes matching the main page
2. Use similar shadcn/ui component patterns as shown in the main page
3. Include responsive design considerations
4. Add proper accessibility attributes (aria-labels, semantic HTML)
5. Create a functional, production-ready page layout
6. Include realistic content and data that fits the page type and application context

CONTENT GUIDELINES:
- Generate realistic, contextually appropriate content (don't use Lorem Ipsum)
- Create functional UI elements appropriate for the page type
- Include proper navigation elements if they exist in the main page
- Add interactive elements like buttons, forms, tables, etc. as appropriate for the page type

Please generate a complete, professional HTML page that serves as a ${selectedPageType} while maintaining perfect visual and functional consistency with the main design.`;

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

    userPrompt += `\n\nPlease generate a professional ${selectedPageType} that maintains complete design consistency with the main page while serving its specific functional purpose. Be creative and contextually appropriate!`;

    const messagesContent: any[] = [
      {
        type: "text",
        text: userPrompt,
      },
      ...visionImages,
    ];

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
    console.error("Workflow generation API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process workflow generation request!",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
