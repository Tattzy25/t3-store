"use client"

import { Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { ImageFile } from "@/lib/types"

interface ProcessingProgressProps {
  images: ImageFile[]
  currentIndex: number
}

export function ProcessingProgress({ images, currentIndex }: ProcessingProgressProps) {
  const total = images.length
  const completed = images.filter((img) => img.status === "complete" || img.status === "error").length
  const isProcessing = images.some((img) => img.status === "processing")

  if (!isProcessing && completed === 0) return null

  const progress = total > 0 ? (completed / total) * 100 : 0
  const allDone = completed === total

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!allDone && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          <span className="text-sm font-medium text-foreground">
            {allDone
              ? `All ${total} images processed`
              : `Processing image ${currentIndex + 1} of ${total}...`}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completed}/{total} complete
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  )
}
