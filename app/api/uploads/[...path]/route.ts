import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new Response("Not Found", { status: 404 });
    }

    // C2 fix: Reject path segments containing traversal patterns
    if (pathSegments.some((seg: string) => seg === ".." || seg.includes("\0"))) {
      return new Response("Forbidden", { status: 403 });
    }

    // Use path.resolve for robust normalization, then verify it's still under UPLOADS_ROOT
    const safePath = path.resolve(UPLOADS_ROOT, ...pathSegments);

    // Prevent directory traversal attacks
    if (!safePath.startsWith(UPLOADS_ROOT)) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const fileBuffer = await fs.readFile(safePath);

      // Detect content type from file extension
      const ext = path.extname(safePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".gif") contentType = "image/gif";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".svg") contentType = "image/svg+xml";

      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
