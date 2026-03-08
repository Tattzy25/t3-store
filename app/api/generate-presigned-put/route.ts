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
    const key = `img-base/${slug}-${timestamp}${ext}`

    const putUrl = await generatePresignedPutUrl(key)

    return NextResponse.json({ putUrl, key })
  } catch (error) {
    console.error("Presigned PUT error:", error)
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 })
  }
}