"use client"

import { useState, useCallback, useRef } from "react"
import { Scan, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload-zone"
import { SettingsPanel } from "@/components/settings-panel"
import { ResultCard } from "@/components/result-card"
import { ExportBar } from "@/components/export-bar"
import { ProcessingProgress } from "@/components/processing-progress"
import type { ImageFile, ProviderConfig } from "@/lib/types"
import { DEFAULT_PROVIDER_CONFIG } from "@/lib/types"
import { generateId, fileToBase64, getMediaType } from "@/lib/image-utils"

export default function Page() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [config, setConfig] = useState<ProviderConfig>(DEFAULT_PROVIDER_CONFIG)
  const [processing, setProcessing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const abortRef = useRef(false)

  const handleAddImages = useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }))
    setImages((prev) => [...prev, ...newImages])
    toast.success(`Added ${files.length} image${files.length !== 1 ? "s" : ""}`)
  }, [])

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img) URL.revokeObjectURL(img.preview)
      return prev.filter((i) => i.id !== id)
    })
  }, [])

  const handleClearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.preview))
    setImages([])
    toast.success("Cleared all images")
  }, [images])

  const handleAnalyze = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === "pending")
    if (pendingImages.length === 0) {
      toast.error("No pending images to analyze")
      return
    }

    setProcessing(true)
    abortRef.current = false

    for (let i = 0; i < pendingImages.length; i++) {
      if (abortRef.current) break

      const img = pendingImages[i]
      setCurrentIndex(i)

      // Mark as processing
      setImages((prev) =>
        prev.map((item) =>
          item.id === img.id ? { ...item, status: "processing" as const } : item
        )
      )

      try {
        const imageBase64 = await fileToBase64(img.file)
        const mediaType = getMediaType(img.file)

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            mediaType,
            providerType: config.type,
            model: config.model,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            systemMessage: config.systemMessage,
            tone: config.tone,
            enabledOutputs: config.enabledOutputs,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Analysis failed")
        }

        const data = await response.json()

        // Step 2: Upload image to T3 using presigned URL
        let blobUrl: string | undefined
        try {
          const title = data.result?.title || img.file.name
          const presignResponse = await fetch("/api/generate-presigned-put", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, filename: img.file.name }),
          })

          if (!presignResponse.ok) {
            throw new Error("Failed to generate presigned URL")
          }

          const { putUrl, key } = await presignResponse.json()

          // Upload to presigned URL
          const uploadResponse = await fetch(putUrl, {
            method: "PUT",
            body: img.file,
            headers: {
              "Content-Type": img.file.type || "image/jpeg",
            },
          })

          if (!uploadResponse.ok) {
            throw new Error("Upload failed")
          }

          // Generate presigned GET URL
          const getResponse = await fetch("/api/generate-presigned-get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
          })

          if (!getResponse.ok) {
            throw new Error("Failed to generate view URL")
          }

          const { getUrl } = await getResponse.json()
          blobUrl = getUrl
        } catch (error) {
          console.warn(`T3 upload error for ${img.file.name}:`, error)
        }

        // Step 3: Index to Upstash Search with image URL + metadata
        let searchIndexId: string | undefined
        if (blobUrl && data.result) {
          try {
            const indexResponse = await fetch("/api/index-search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: img.id,
                imageUrl: blobUrl,
                filename: img.file.name,
                title: data.result.title || "",
                tags: data.result.tags || "",
                shortDescription: data.result.shortDescription || "",
                colorScheme: data.result.colorScheme || "",
                mood: data.result.mood || "",
                style: data.result.style || "",
                dimensions: data.result.dimensions || "",
              }),
            })

            if (indexResponse.ok) {
              const indexData = await indexResponse.json()
              searchIndexId = indexData.id
            } else {
              console.warn(`Search indexing failed for ${img.file.name}`)
            }
          } catch {
            console.warn(`Search indexing error for ${img.file.name}`)
          }
        }

        setImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? {
                  ...item,
                  status: "complete" as const,
                  result: data.result,
                  blobUrl,
                  searchIndexId,
                }
              : item
          )
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        setImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? { ...item, status: "error" as const, error: message }
              : item
          )
        )
        toast.error(`Failed: ${img.file.name} - ${message}`)
      }
    }

    setProcessing(false)
    if (!abortRef.current) {
      toast.success("Analysis complete")
    }
  }, [images, config])

  const handleRetryFailed = useCallback(() => {
    setImages((prev) =>
      prev.map((img) =>
        img.status === "error"
          ? { ...img, status: "pending" as const, error: undefined }
          : img
      )
    )
  }, [])

  const handleStop = useCallback(() => {
    abortRef.current = true
    setProcessing(false)
    toast.success("Processing stopped")
  }, [])

  const pendingCount = images.filter((img) => img.status === "pending").length
  const completedImages = images.filter((img) => img.status === "complete")
  const errorCount = images.filter((img) => img.status === "error").length

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scan className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">Image Analyzer</h1>
              <p className="text-[11px] text-muted-foreground">AI-powered metadata extraction</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                disabled={processing}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Retry Failed ({errorCount})
              </Button>
            )}
            {images.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={processing}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
        {/* Upload Zone */}
        <UploadZone
          images={images}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
          disabled={processing}
        />

        {/* Settings Panel */}
        <SettingsPanel config={config} onChange={setConfig} />

        {/* Analyze Button */}
        {images.length > 0 && (
          <div className="flex items-center gap-3">
            {!processing ? (
              <Button
                onClick={handleAnalyze}
                disabled={pendingCount === 0}
                className="gap-2 px-6"
                size="lg"
              >
                <Scan className="h-4 w-4" />
                Analyze {pendingCount > 0 ? `${pendingCount} Image${pendingCount !== 1 ? "s" : ""}` : "Images"}
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" size="lg" className="gap-2 px-6">
                Stop Processing
              </Button>
            )}
            {pendingCount === 0 && !processing && completedImages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                All images have been processed. Add more or retry failed ones.
              </p>
            )}
          </div>
        )}

        {/* Processing Progress */}
        <ProcessingProgress images={images} currentIndex={currentIndex} />

        {/* Export Bar */}
        <ExportBar images={images} enabledOutputs={config.enabledOutputs} />

        {/* Results */}
        {completedImages.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Results ({completedImages.length})
            </h2>
            <div className="flex flex-col gap-4">
              {completedImages.map((image) => (
                <ResultCard
                  key={image.id}
                  image={image}
                  enabledOutputs={config.enabledOutputs}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error results */}
        {errorCount > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-destructive">
              Failed ({errorCount})
            </h2>
            {images
              .filter((img) => img.status === "error")
              .map((img) => (
                <div
                  key={img.id}
                  className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.preview}
                      alt={img.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{img.file.name}</p>
                    <p className="text-xs text-destructive">{img.error}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Scan className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No images yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload images above to start generating AI metadata
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
