import { generateText, Output } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { imageAnalysisSchema, seoSchema } from "@/lib/schema"
import { userMessage } from "@/lib/Agent-Prompter-User-Message"
import { AGENT_SEO_USER_MESSAGE } from "@/lib/Agent-SEO-User-Message"
import { AGENT_SEO_SYSTEM_PROMPT } from "@/lib/Agent-SEO-System-Prompt"
import { generatePresignedPutUrl } from "@/lib/t3-presigned"
import type { OutputField, ToneOption } from "@/lib/types"



const JSON_INSTRUCTION_PROMPT = "Return your response as a JSON object, matching the provided schema. Do NOT include any other text or formatting."

export const maxDuration = 60

const TONE_PROMPTS: Record<ToneOption, string> = {
  neutral: "Use a balanced and objective tone.",
  professional: "Use a formal, business-appropriate tone.",
  casual: "Use a friendly, conversational tone.",
  creative: "Use an imaginative, expressive tone.",
  technical: "Use a detailed, precise, and technical tone.",
  marketing: "Use a persuasive, engaging, marketing-focused tone.",
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    imageBase64,
    mediaType,
    providerType,
    model,
    apiKey,
    baseUrl,
    systemMessage,
    tone,
    enabledOutputs,
  } = body as {
    imageBase64: string
    mediaType: string
    providerType: "gateway" | "ollama" | "custom"
    model: string
    apiKey?: string
    baseUrl?: string
    systemMessage: string
    tone: ToneOption
    enabledOutputs: OutputField[]
  }

  const outputFieldsStr = enabledOutputs.join(", ")

  const fullSystemMessage = [
    systemMessage,
    TONE_PROMPTS[tone],
    `Only generate the following fields: ${outputFieldsStr}. Leave unused fields as empty strings or empty arrays.`,
    JSON_INSTRUCTION_PROMPT,
  ].join("\n\n")

  try {
    let modelRef: Parameters<typeof generateText>[0]["model"]

    if (providerType === "gateway") {
      // Vercel AI Gateway - just pass model string
      modelRef = model as Parameters<typeof generateText>[0]["model"]
    } else if (providerType === "ollama") {
      const ollamaProvider = createOpenAICompatible({
        name: "ollama",
        baseURL: "http://win-982dtlic65e.tail72bdb2.ts.net:11434",
      })
      const modelName = model.startsWith("ollama/") ? model.slice(7) : model
      modelRef = ollamaProvider(modelName)
    } else {
      // Custom OpenAI-compatible provider
      const customProvider = createOpenAICompatible({
        name: "custom",
        baseURL: baseUrl,
        apiKey: apiKey || undefined,
      })
      modelRef = customProvider(model)
    }

    // First call: Initial analysis with Agent Prompter - with retry
    const maxRetries = 3;
    let lastError: Error | null = null;
    let initialOutput: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { output } = await generateText({
          model: modelRef,
          output: Output.object({
            schema: imageAnalysisSchema,
          }),
          messages: [
            {
              role: "system",
              content: fullSystemMessage,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userMessage,
                },
                {
                  type: "image",
                  image: imageBase64,
                },
              ],
            },
          ],
        });
        initialOutput = output;
        break; // Success, exit loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error during initial analysis");
        console.error(`Initial analysis attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === maxRetries) {
          throw lastError; // Re-throw after all retries
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Second call: SEO generation with Agent SEO, using initial analysis for context and including image - with retry
    const analysisJson = JSON.stringify(initialOutput, null, 2)
    const seoUserPromptText = `${AGENT_SEO_USER_MESSAGE}\n\nReference analysis from Agent Prompter:\n${analysisJson}`

    const fullSeoSystemMessage = [
      AGENT_SEO_SYSTEM_PROMPT,
      TONE_PROMPTS[tone],
      JSON_INSTRUCTION_PROMPT,
    ].join("\n\n")

    let lastErrorSeo: Error | null = null;
    let seoOutput: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { output } = await generateText({
          model: modelRef,
          output: Output.object({
            schema: seoSchema,
          }),
          messages: [
            {
              role: "system",
              content: fullSeoSystemMessage,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: seoUserPromptText,
                },
                {
                  type: "image",
                  image: imageBase64,
                },
              ],
            },
          ],
        });
        seoOutput = output;
        break; // Success, exit loop
      } catch (error) {
        lastErrorSeo = error instanceof Error ? error : new Error("Unknown error during SEO generation");
        console.error(`SEO generation attempt ${attempt} failed:`, lastErrorSeo.message);
        
        if (attempt === maxRetries) {
          throw lastErrorSeo; // Re-throw after all retries
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Merge outputs
    const mergedOutput = {
      ...initialOutput,
      ...seoOutput,
    }

    // Generate presigned PUT URL after Agent SEO completion - with retry
    const titleForKey = seoOutput.seoTitle || initialOutput.title || "design"
    const ext = mediaType.split('/')[1] || 'png'
    const slug = titleForKey.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
    const timestamp = Date.now()
    const key = `${slug}-${timestamp}.${ext}`

    let lastErrorPut: Error | null = null;
    let putUrl: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        putUrl = await generatePresignedPutUrl(key);
        break; // Success, exit loop
      } catch (error) {
        lastErrorPut = error instanceof Error ? error : new Error("Unknown error during presigned URL generation");
        console.error(`Presigned URL attempt ${attempt} failed:`, lastErrorPut.message);
        
        if (attempt === maxRetries) {
          throw lastErrorPut; // Re-throw after all retries
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Filter merged output to only enabled fields
    const allFields: OutputField[] = [
      "sku", "productUrl", "title", "tags", "shortDescription", "dimensions",
      "mood", "style", "color", "imageAltText", "prompt",
      "seoTitle", "seoDescription", "body"
    ]
    const filtered: Record<string, unknown> = {}
    for (const field of allFields) {
      if (enabledOutputs.includes(field)) {
        const val = mergedOutput[field]
        filtered[field] = val
      } else {
        filtered[field] = ""
      }
    }

    return Response.json({ result: filtered, putUrl, key })


  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Analysis API error:", error);
    return Response.json(
      {
        error: "Internal Server Error during analysis",
        details: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
