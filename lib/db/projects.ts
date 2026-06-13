import { prisma } from "../db";
import fs from "fs/promises";
import path from "path";

export async function getAllProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { lastModified: "desc" },
    select: {
      id: true,
      name: true,
      projectNumber: true,
      thumbnail: true,
      lastModified: true,
      createdAt: true,
      isPublic: true,
      sketchesData: true,
      styleGuide: true,
    },
  });
  // Map fields to match the UI expectations (e.g. converting Date to number timestamp, _id instead of id)
  return projects.map((p: {
    id: string;
    name: string;
    projectNumber: number;
    thumbnail: string | null;
    lastModified: Date;
    createdAt: Date;
    isPublic: boolean;
    sketchesData: string;
    styleGuide: string | null;
  }) => {
    let htmlPreview: string | null = null;
    let isMobile = false;
    let canvasWidth = 1024;
    let canvasHeight = 576;
    try {
      if (p.sketchesData) {
        const parsed = JSON.parse(p.sketchesData);
        const entities = parsed.shapes?.entities || parsed.entities || {};
        
        let genUI = null;
        if (parsed.shapes?.ids && parsed.shapes?.entities) {
          const ids = parsed.shapes.ids;
          const shapesEntities = parsed.shapes.entities;
          for (let i = ids.length - 1; i >= 0; i--) {
            const s = shapesEntities[ids[i]];
            if (s && s.type === "generatedui" && s.uiSpecData) {
              genUI = s;
              break;
            }
          }
        }
        
        if (!genUI) {
          const shapes = Object.values(entities) as any[];
          const genUIs = shapes.filter(
            (s) => s && s.type === "generatedui" && s.uiSpecData
          );
          if (genUIs.length > 0) {
            genUIs.sort((a, b) => (b.x || 0) - (a.x || 0));
            genUI = genUIs[0];
          }
        }

        if (genUI) {
          htmlPreview = genUI.uiSpecData;
          isMobile = genUI.w < 500;
          canvasWidth = genUI.w;
          canvasHeight = genUI.h;
        }
      }
    } catch (e) {
      console.warn("Failed to parse sketchesData for preview:", e);
    }

    let styleGuideObj = null;
    try {
      if (p.styleGuide) {
        styleGuideObj = JSON.parse(p.styleGuide);
      }
    } catch (e) {
      console.warn("Failed to parse styleGuide:", e);
    }

    return {
      _id: p.id,
      name: p.name,
      projectNumber: p.projectNumber,
      thumbnail: p.thumbnail,
      lastModified: p.lastModified.getTime(),
      createdAt: p.createdAt.getTime(),
      isPublic: p.isPublic,
      htmlPreview,
      isMobile,
      canvasWidth,
      canvasHeight,
      styleGuide: styleGuideObj,
    };
  });
}

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      moodBoardImages: true,
      inspirationImages: true,
      settings: true,
    },
  });

  if (!project) return null;

  // Map to match the expected format in UI (including JSON parsing)
  return {
    ...project,
    _id: project.id,
    sketchesData: JSON.parse(project.sketchesData),
    viewportData: project.viewportData
      ? JSON.parse(project.viewportData)
      : null,
    lastModified: project.lastModified.getTime(),
    createdAt: project.createdAt.getTime(),
  };
}

const DEFAULT_STYLE_GUIDE = {
  theme: "Warm Cream & Coral Theme",
  description: "Vibrant and encouraging brand style with warm beige backgrounds and coral accents.",
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
    designMd: `---
name: Warm Cream & Coral Theme
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
# Design System

## Overview
Vibrant and encouraging brand style with warm beige backgrounds and coral accents.

## Colors
- **Primary Accent** (#db2800): Main interactive elements and buttons.
- **Background Surface** (#faf8f5): Application container background.
- **On-Surface Text** (#2e2925): Primary content text color.

## Typography
- **Headings**: Host Grotesk
- **Body**: DM Sans

## Shapes
- **Card Corners**: 18px
- **Button Corners**: 9999px

## Layout
- **Minimal Spacing**: 15px
`,
  },
};

export async function createProject(data: {
  name?: string;
  sketchesData?: Record<string, unknown>;
  thumbnail?: string;
}) {
  const maxProject = await prisma.project.findFirst({
    orderBy: { projectNumber: "desc" },
    select: { projectNumber: true },
  });
  const projectNumber = maxProject ? maxProject.projectNumber + 1 : 1;
  const name = data.name || `Project ${projectNumber}`;

  const project = await prisma.project.create({
    data: {
      name,
      projectNumber,
      sketchesData: data.sketchesData
        ? JSON.stringify(data.sketchesData)
        : "{}",
      styleGuide: JSON.stringify(DEFAULT_STYLE_GUIDE),
      thumbnail: data.thumbnail || null,
      isPublic: false,
    },
  });

  return {
    projectId: project.id,
    name: project.name,
    projectNumber: project.projectNumber,
  };
}

export async function updateProjectSketches(
  id: string,
  sketchesData: Record<string, unknown>,
  viewportData?: Record<string, unknown>,
) {
  const updateData: { sketchesData: string; viewportData?: string } = {
    sketchesData: JSON.stringify(sketchesData),
  };
  if (viewportData) {
    updateData.viewportData = JSON.stringify(viewportData);
  }

  await prisma.project.update({
    where: { id },
    data: updateData,
  });

  return { success: true };
}

export async function updateProjectStyleGuide(id: string, styleGuideData: any) {
  await prisma.project.update({
    where: { id },
    data: {
      styleGuide: JSON.stringify(styleGuideData),
    },
  });

  return { success: true, styleGuide: styleGuideData };
}

export async function getProjectStyleGuide(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { styleGuide: true },
  });

  if (!project || !project.styleGuide) return null;

  try {
    return JSON.parse(project.styleGuide);
  } catch (error) {
    console.error("Error parsing style guide JSON:", error);
    throw new Error("Invalid style guide format");
  }
}

export async function deleteProject(id: string) {
  // Delete uploads folders on disk
  const uploadsRoot = path.join(process.cwd(), "data", "uploads");
  const moodboardDir = path.join(uploadsRoot, "moodboard", id);
  const inspirationDir = path.join(uploadsRoot, "inspiration", id);

  try {
    await fs.rm(moodboardDir, { recursive: true, force: true });
  } catch (error) {
    console.warn("Could not delete moodboard directory:", moodboardDir, error);
  }

  try {
    await fs.rm(inspirationDir, { recursive: true, force: true });
  } catch (error) {
    console.warn("Could not delete inspiration directory:", inspirationDir, error);
  }

  await prisma.project.delete({
    where: { id },
  });
  return { success: true };
}

export async function renameProject(id: string, name: string) {
  const project = await prisma.project.update({
    where: { id },
    data: { name },
  });
  return { success: true, name: project.name };
}
