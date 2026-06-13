import { prisma } from "../db";
import fs from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads");

// Helper to ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Ignore if already exists
  }
}

export async function addMoodBoardImage(
  projectId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
) {
  const uniqueName = `${Date.now()}_${fileName.replace(/\s+/g, "_")}`;
  const relativeDir = path.join("moodboard", projectId);
  const targetDir = path.join(UPLOADS_ROOT, relativeDir);
  await ensureDir(targetDir);

  const targetPath = path.join(targetDir, uniqueName);
  await fs.writeFile(targetPath, fileBuffer);

  const filePath = path.join(relativeDir, uniqueName).replace(/\\/g, "/");

  const image = await prisma.moodBoardImage.create({
    data: {
      projectId,
      filePath,
      fileName,
      mimeType,
    },
  });

  return {
    _id: image.id,
    projectId: image.projectId,
    url: `/api/uploads/${image.filePath}`,
    createdAt: image.createdAt.getTime(),
  };
}

export async function removeMoodBoardImage(id: string) {
  const image = await prisma.moodBoardImage.findUnique({
    where: { id },
  });

  if (!image) return { success: false };

  // Delete file from disk
  const absolutePath = path.join(UPLOADS_ROOT, image.filePath);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    console.warn("Could not delete file from disk:", absolutePath, error);
  }

  // Delete from DB
  await prisma.moodBoardImage.delete({
    where: { id },
  });

  return { success: true };
}

export async function getMoodBoardImages(projectId: string) {
  const images = await prisma.moodBoardImage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return images.map((img: {
    id: string;
    projectId: string;
    filePath: string;
    createdAt: Date;
  }) => ({
    _id: img.id,
    projectId: img.projectId,
    url: `/api/uploads/${img.filePath}`,
    createdAt: img.createdAt.getTime(),
  }));
}

export async function addInspirationImage(
  projectId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
) {
  const uniqueName = `${Date.now()}_${fileName.replace(/\s+/g, "_")}`;
  const relativeDir = path.join("inspiration", projectId);
  const targetDir = path.join(UPLOADS_ROOT, relativeDir);
  await ensureDir(targetDir);

  const targetPath = path.join(targetDir, uniqueName);
  await fs.writeFile(targetPath, fileBuffer);

  const filePath = path.join(relativeDir, uniqueName).replace(/\\/g, "/");

  const image = await prisma.inspirationImage.create({
    data: {
      projectId,
      filePath,
      fileName,
      mimeType,
    },
  });

  return {
    _id: image.id,
    projectId: image.projectId,
    url: `/api/uploads/${image.filePath}`,
    createdAt: image.createdAt.getTime(),
  };
}

export async function removeInspirationImage(id: string) {
  const image = await prisma.inspirationImage.findUnique({
    where: { id },
  });

  if (!image) return { success: false };

  // Delete file from disk
  const absolutePath = path.join(UPLOADS_ROOT, image.filePath);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    console.warn("Could not delete file from disk:", absolutePath, error);
  }

  // Delete from DB
  await prisma.inspirationImage.delete({
    where: { id },
  });

  return { success: true };
}

export async function getInspirationImages(projectId: string) {
  const images = await prisma.inspirationImage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return images.map((img: {
    id: string;
    projectId: string;
    filePath: string;
    createdAt: Date;
  }) => ({
    _id: img.id,
    projectId: img.projectId,
    url: `/api/uploads/${img.filePath}`,
    createdAt: img.createdAt.getTime(),
  }));
}
