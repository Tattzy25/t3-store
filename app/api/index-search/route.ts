import { Search } from "@upstash/search"
import { type NextRequest, NextResponse } from "next/server"

type SearchContent = {
  sku: string
  productUrl: string
  title: string
  tags: string
  shortDescription: string
  dimensions: string
  mood: string
  style: string
  color: string
}

type SearchMetadata = {
  seoTitle: string
  seoDescription: string
  body: string
  imageAltText: string
  prompt: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      sku,
      productUrl,
      title,
      tags,
      shortDescription,
      dimensions,
      mood,
      style,
      color,
      seoTitle,
      seoDescription,
      body: bodyText,
      imageAltText,
      prompt,
    } = body as {
      id: string
      sku: string
      productUrl: string
      title: string
      tags: string
      shortDescription: string
      dimensions: string
      mood: string
      style: string
      color: string
      seoTitle: string
      seoDescription: string
      body: string
      imageAltText: string
      prompt: string
    }

    const searchUrl = process.env.UPSTASH_SEARCH_REST_URL
    const searchToken = process.env.UPSTASH_SEARCH_REST_TOKEN


    const client = new Search({
      url: searchUrl,
      token: searchToken,
    })

    const index = client.index<SearchContent, SearchMetadata>("gallery")

    // Retry logic for upsert
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await index.upsert([
          {
            id,
            content: {
              sku: sku,
              productUrl: productUrl,
              title: title,
              tags: tags,
              shortDescription: shortDescription,
              dimensions: dimensions,
              mood: mood,
              style: style,
              color: color,
            },
            metadata: {
              seoTitle: seoTitle,
              seoDescription: seoDescription,
              body: bodyText,
              imageAltText: imageAltText,
              prompt: prompt,
            },
          },
        ]);

        return NextResponse.json({ success: true, id });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error during upsert");
        console.error(`Upsert attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === maxRetries) {
          throw lastError; // Re-throw after all retries
        }
        
        // Wait before retry (exponential backoff optional, simple delay here)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  } catch (error) {
    console.error("Search indexing error:", error);
    const message = error instanceof Error ? error.message : "Indexing failed after retries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
