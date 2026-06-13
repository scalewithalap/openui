import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { projectId, shapesData, viewportData } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // H3: Basic structural validation to prevent corrupted data
    if (shapesData !== undefined && (typeof shapesData !== "object" || shapesData === null)) {
      return NextResponse.json({ error: "Invalid shapesData format" }, { status: 400 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        sketchesData: JSON.stringify(shapesData),
        viewportData: viewportData ? JSON.stringify(viewportData) : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Autosave error:", error);
    return NextResponse.json({ error: "Autosave failed" }, { status: 500 });
  }
}
