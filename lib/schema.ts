import { z } from "zod"

export const imageAnalysisSchema = z.object({
  sku: z.string().describe("Sku"),
  productUrl: z.string().describe("Product URL"),
  title: z.string().describe("Title"),
  tags: z.string().describe("Tags: comma space"),
  shortDescription: z.string().describe("Short Description"),
  dimensions: z.string().describe("Dimensions"),
  mood: z.string().describe("Mood"),
  style: z.string().describe("Style"),
  color: z.string().describe("Color"),
  imageAltText: z.string().describe("Image Alt Text"),
  prompt: z.string().describe("Prompt"),
  seoTitle: z.string().describe("SEO Title"),
  seoDescription: z.string().describe("SEO Description"),
  body: z.string().describe("Body"),
})

export const seoSchema = z.object({
  seoTitle: z.string().describe("SEO Title"),
  seoDescription: z.string().describe("SEO Description"),
  body: z.string().describe("Body"),
})

export type ImageAnalysisSchema = z.infer<typeof imageAnalysisSchema>
export type SeoSchema = z.infer<typeof seoSchema>

