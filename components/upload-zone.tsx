"use client"

import { useCallback, useRef } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ImageFile } from "@/lib/types"
import { formatFileSize } from "@/lib/image-utils"

interface UploadZoneProps {
  images: ImageFile[]
  onAddImages: (files: File[]) => void
  onRemoveImage: (id: string) => void
  disabled?: boolean
}

export function UploadZone({ images, onAddImages, onRemoveImage, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
      if (files.length > 0) onAddImages(files)
    },
    [onAddImages, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"))
      if (files.length > 0) onAddImages(files)
      if (inputRef.current) inputRef.current.value = ""
    },
    [onAddImages]
  )

  const statusColor: Record<string, string> = {
    pending: "bg-muted-foreground/20 text-muted-foreground",
    processing: "bg-chart-1/20 text-chart-1",
    complete: "bg-green-500/20 text-green-600",
    error: "bg-destructive/20 text-destructive",
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          disabled
            ? "border-border/50 bg-muted/30 cursor-not-allowed opacity-60"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        )}
        role="button"
        tabIndex={0}
        aria-label="Upload images by clicking or dragging files here"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (!disabled) inputRef.current?.click()
          }
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Drop images here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports JPG, PNG, WebP, GIF. Multiple files allowed.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {images.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {images.length} image{images.length !== 1 ? "s" : ""} selected
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative flex flex-col items-center gap-1 rounded-md border bg-card p-2"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="h-full w-full object-cover"
                  />
                  {img.status !== "pending" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      {img.status === "processing" && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                      {img.status === "complete" && (
                        <ImageIcon className="h-5 w-5 text-green-500" />
                      )}
                      {img.status === "error" && (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col items-center gap-1">
                  <p className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {img.file.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatFileSize(img.file.size)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn("text-[9px] px-1.5 py-0 h-4 capitalize", statusColor[img.status])}
                    >
                      {img.status}
                    </Badge>
                  </div>
                </div>
                {img.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveImage(img.id)
                    }}
                    aria-label={`Remove ${img.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
