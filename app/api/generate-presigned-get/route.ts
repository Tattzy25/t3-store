import { NextRequest, NextResponse } from "next/server"
import { generatePresignedGetUrl } from "@/lib/t3-presigned"

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()
    if (!key) {
      return NextResponse.json({ error: "Key required" }, { status: 400 })
    }

    const getUrl = await generatePresignedGetUrl(key)

    return NextResponse.json({ getUrl })
  } catch (error) {
    console.error("Presigned GET error:", error)
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 })
  }
}