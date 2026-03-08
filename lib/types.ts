export type ImageStatus = "pending" | "processing" | "complete" | "error"

export interface ImageFile {
  id: string
  file: File
  preview: string
  status: ImageStatus
  result?: ImageAnalysisResult
  error?: string
  imageUrl?: string
  searchIndexId?: string
  currentStepMessage?: string
}

export interface ImageAnalysisResult {
  sku: string
  productUrl: string
  title: string
  tags: string
  shortDescription: string
  dimensions: string
  mood: string
  style: string
  color: string
  imageAltText: string
  prompt: string
  seoTitle: string
  seoDescription: string
  body: string
}


export type OutputField =
  | "sku"
  | "productUrl"
  | "title"
  | "tags"
  | "shortDescription"
  | "dimensions"
  | "mood"
  | "style"
  | "color"
  | "imageAltText"
  | "prompt"
  | "seoTitle"
  | "seoDescription"
  | "body"


export type ToneOption = "neutral" | "professional" | "casual" | "creative" | "technical" | "marketing"

export type ExportFormat = "json" | "csv"

export type ProviderType = "gateway" | "ollama" | "custom"

export interface ProviderConfig {
  type: ProviderType
  model: string
  apiKey?: string
  baseUrl?: string
  systemMessage: string
  tone: ToneOption
  enabledOutputs: OutputField[]
}

import { systemPrompt } from "./Agent-Prompter-System-Prompt"

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  type: "gateway",
  model: "openai/gpt-4o",
  systemMessage: systemPrompt,
  tone: "professional",
  enabledOutputs: [
    "sku",
    "productUrl",
    "title",
    "tags",
    "shortDescription",
    "dimensions",
    "mood",
    "style",
    "color",
    "imageAltText",
    "prompt",
    "seoTitle",
    "seoDescription",
    "body",
  ],
}


export const TONE_DESCRIPTIONS: Record<ToneOption, string> = {
  neutral: "Balanced and objective",
  professional: "Formal and business-appropriate",
  casual: "Friendly and conversational",
  creative: "Imaginative and expressive",
  technical: "Detailed and precise",
  marketing: "Persuasive and engaging",
}

export const OUTPUT_FIELD_LABELS: Record<OutputField, string> = {
  sku: "Sku",
  productUrl: "Product URL",
  title: "Title",
  tags: "Tags",
  shortDescription: "Short Description",
  dimensions: "Dimensions",
  mood: "Mood",
  style: "Style",
  color: "Color",
  imageAltText: "Image Alt Text",
  prompt: "Prompt",
  seoTitle: "SEO Title",
  seoDescription: "SEO Description",
  body: "Body",
}


export const GATEWAY_MODELS = [
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
  { value: "google/gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash" },
]
