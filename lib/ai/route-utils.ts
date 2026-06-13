import {
  getLanguageModel,
  getVisionLanguageModel,
  getFallbackModel,
  ProviderKey,
} from "@/lib/ai/provider-registry";
import { prisma } from "@/lib/db";
import type { LanguageModel } from "ai";

/**
 * Resolves the AI language model for a given project.
 * Falls back to the environment-configured default model.
 *
 * @param projectId - The project ID to resolve settings from
 * @param requireVision - If true, ensures the resolved model supports vision input
 * @returns The resolved AI language model
 */
export async function resolveModelForProject(
  projectId: string,
  requireVision: boolean = false,
): Promise<LanguageModel> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { settings: true },
  });

  if (!project) {
    throw new ProjectNotFoundError(projectId);
  }

  let model: LanguageModel;
  try {
    const settings = project.settings;
    if (settings?.provider && settings?.model) {
      const resolveModel = requireVision
        ? getVisionLanguageModel
        : getLanguageModel;
      model = resolveModel(
        settings.provider as ProviderKey,
        settings.model,
      ) as LanguageModel;
    } else {
      model = getFallbackModel() as LanguageModel;
    }
  } catch (err) {
    console.warn("Failed to resolve project model, using fallback:", err);
    model = getFallbackModel() as LanguageModel;
  }

  return model;
}

/**
 * Resolves the project with full relations (settings, inspirationImages, moodBoardImages).
 * Used when the route needs both the model and project data.
 */
export async function getProjectWithRelations(
  projectId: string,
  relations: {
    settings?: boolean;
    inspirationImages?: boolean;
    moodBoardImages?: boolean;
  } = { settings: true },
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      settings: relations.settings ?? false,
      inspirationImages: relations.inspirationImages ?? false,
      moodBoardImages: relations.moodBoardImages ?? false,
    },
  });

  if (!project) {
    throw new ProjectNotFoundError(projectId);
  }

  return project;
}

/**
 * Creates a streaming Response from an AI SDK textStream.
 * Reuses a single TextEncoder instance and wraps the stream properly.
 */
export function createStreamResponse(
  textStream: AsyncIterable<string>,
  contentType: string = "text/event-stream; charset=utf-8",
  streamId: string = "default-stream-id",
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          const payload = {
            streamId,
            text: chunk,
          };
          const sseMessage = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Custom error for project-not-found, allowing routes to detect
 * and return 404 vs 500.
 */
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = "ProjectNotFoundError";
  }
}
