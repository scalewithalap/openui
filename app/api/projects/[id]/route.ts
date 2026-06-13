import { NextResponse } from "next/server";
import { getProject, deleteProject, renameProject } from "@/lib/db/projects";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error(`Error fetching project:`, error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteProject(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error deleting project:`, error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    const result = await renameProject(id, name);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error renaming project:`, error);
    return NextResponse.json({ error: "Failed to rename project" }, { status: 500 });
  }
}
