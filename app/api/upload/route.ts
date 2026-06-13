import { NextRequest, NextResponse } from "next/server";
import {
  addMoodBoardImage,
  addInspirationImage,
  removeMoodBoardImage,
  removeInspirationImage,
} from "@/lib/db/images";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const type = formData.get("type") as string; // "moodboard" | "inspiration"

    if (!file || !projectId || !type) {
      return NextResponse.json(
        { error: "Missing file, projectId, or type" },
        { status: 400 }
      );
    }

    // C3: Validate file size before loading into memory
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // C4: Validate MIME type against allowlist
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (PNG, JPEG, GIF, WebP, SVG) are allowed." },
        { status: 400 }
      );
    }

    if (type !== "moodboard" && type !== "inspiration") {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let result;
    if (type === "moodboard") {
      result = await addMoodBoardImage(projectId, file.name, file.type, buffer);
    } else {
      result = await addInspirationImage(projectId, file.name, file.type, buffer);
    }

    // Return storageId matching the frontend expectation
    return NextResponse.json({
      success: true,
      storageId: result._id,
      url: result.url,
    });
  } catch (error) {
    console.error("Error processing file upload:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // "moodboard" | "inspiration"

    if (!id || !type) {
      return NextResponse.json({ error: "Missing id or type parameter" }, { status: 400 });
    }

    let result;
    if (type === "moodboard") {
      result = await removeMoodBoardImage(id);
    } else if (type === "inspiration") {
      result = await removeInspirationImage(id);
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting upload:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
