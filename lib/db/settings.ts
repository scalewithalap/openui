import { prisma } from "../db";

export async function getProjectSettings(projectId: string) {
  return prisma.projectSettings.findUnique({
    where: { projectId },
  });
}

export async function updateProjectSettings(
  projectId: string,
  settings: { provider: string | null; model: string | null }
) {
  return prisma.projectSettings.upsert({
    where: { projectId },
    update: {
      provider: settings.provider,
      model: settings.model,
    },
    create: {
      projectId,
      provider: settings.provider,
      model: settings.model,
    },
  });
}
