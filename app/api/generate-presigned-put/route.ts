import { NextRequest, NextResponse } from "next/server"
import { generatePresignedPutUrl } from "@/lib/t3-presigned"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext && ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(ext)) {
    return `.${ext}`
  }
  return ".png"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, filename } = body
    if (!title || !filename) {
      return NextResponse.json({ error: "Title and filename required" }, { status: 400 })
    }

    const ext = getExtension(filename)
    const slug = title ? slugify(title) : slugify(filename.replace(/\.[^/.]+$/, ""))
    const timestamp = Date.now()
    const key = `${slug}-${timestamp}${ext}`

    // Retry logic for presigned URL generation
    const maxRetries = 3;
    let lastError: Error | null = null;
    let putUrl: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        putUrl = await generatePresignedPutUrl(key);
        break; // Success, exit loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error during presigned URL generation");
        console.error(`Presigned URL attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === maxRetries) {
          throw lastError; // Re-throw after all retries
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return NextResponse.json({ putUrl, key })
  } catch (error) {
    console.error("Presigned PUT error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate presigned URL after retries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}