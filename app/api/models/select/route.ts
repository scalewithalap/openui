import { NextRequest, NextResponse } from "next/server";
import { getProjectSettings, updateProjectSettings } from "@/lib/db/settings";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const settings = await getProjectSettings(projectId);
    return NextResponse.json({
      provider: settings?.provider || null,
      model: settings?.model || null,
    });
  } catch (error) {
    console.error("Error fetching project settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let { projectId, provider, model } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    if ((!provider || provider === "undefined") && model) {
      const parts = model.split("/");
      if (parts.length > 0) {
        provider = parts[0];
      }
    }

    const settings = await updateProjectSettings(projectId, { 
      provider: provider || "openrouter", 
      model: model || null 
    });
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    console.error("Error updating project settings:", error);
    return NextResponse.json({
      error: "Failed to update settings",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
