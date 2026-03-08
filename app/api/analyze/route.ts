import { generateText, Output } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { imageAnalysisSchema, seoSchema } from "@/lib/schema"
import { userMessage } from "@/lib/Agent-Prompter-User-Message"
import { AGENT_SEO_USER_MESSAGE } from "@/lib/Agent-SEO-User-Message"
import { AGENT_SEO_SYSTEM_PROMPT } from "@/lib/Agent-SEO-System-Prompt"
import { generatePresignedPutUrl } from "@/lib/t3-presigned"
import type { OutputField, ToneOption } from "@/lib/types"



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
  ].join("\n\n")

  try {
    let modelRef: Parameters<typeof generateText>[0]["model"]

    if (providerType === "gateway") {
      // Vercel AI Gateway - just pass model string
      modelRef = model as Parameters<typeof generateText>[0]["model"]
    } else if (providerType === "ollama") {
      const ollamaProvider = createOpenAICompatible({
        name: "ollama",
        baseURL: baseUrl || "win-982dtlic65e.tail72bdb2.ts.net",
      })
      const modelName = model.startsWith("ollama/") ? model.slice(7) : model
      modelRef = ollamaProvider(modelName)
    } else {
      // Custom OpenAI-compatible provider
      if (!baseUrl) {
        return Response.json({ error: "Base URL is required for custom providers" }, { status: 400 })
      }
      const customProvider = createOpenAICompatible({
        name: "custom",
        baseURL: baseUrl,
        apiKey: apiKey || undefined,
      })
      modelRef = customProvider(model)
    }

    // First call: Initial analysis with Agent Prompter
    const { output: initialOutput } = await generateText({
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
    })

    // Second call: SEO generation with Agent SEO, using initial analysis for context and including image
    const analysisJson = JSON.stringify(initialOutput, null, 2)
    const seoUserPromptText = `${AGENT_SEO_USER_MESSAGE}\n\nReference analysis from Agent Prompter:\n${analysisJson}`

    const fullSeoSystemMessage = [
      AGENT_SEO_SYSTEM_PROMPT,
      TONE_PROMPTS[tone],
    ].join("\n\n")

    const { output: seoOutput } = await generateText({
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
    })

    // Merge outputs
    const mergedOutput = {
      ...initialOutput,
      ...seoOutput,
    }

    // Generate presigned PUT URL after Agent SEO completion
    const titleForKey = seoOutput.seoTitle || initialOutput.title || "design"
    const ext = mediaType.split('/')[1] || 'png'
    const slug = titleForKey.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
    const timestamp = Date.now()
    const key = `img-base/${slug}-${timestamp}.${ext}`

    const putUrl = await generatePresignedPutUrl(key)

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
        filtered[field] = val ?? ""
      } else {
        filtered[field] = ""
      }
    }

    return Response.json({ result: filtered, putUrl, key })


  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analysis failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
