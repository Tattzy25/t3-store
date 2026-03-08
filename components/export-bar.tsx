"use client"

import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ImageFile, OutputField } from "@/lib/types"
import { OUTPUT_FIELD_LABELS } from "@/lib/types"
import { exportToJSON, exportToCSV, downloadFile } from "@/lib/export"

interface ExportBarProps {
  images: ImageFile[]
  enabledOutputs: OutputField[]
}

export function ExportBar({ images, enabledOutputs }: ExportBarProps) {
  const completedCount = images.filter((img) => img.status === "complete").length

  if (completedCount === 0) return null

  const handleExportJSON = () => {
    const json = exportToJSON(images, enabledOutputs)
    downloadFile(json, "image-analysis.json", "application/json")
  }

  const handleExportCSV = () => {
    const csv = exportToCSV(images, enabledOutputs, OUTPUT_FIELD_LABELS)
    downloadFile(csv, "image-analysis.csv", "text/csv")
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">
          {completedCount} result{completedCount !== 1 ? "s" : ""} ready to export
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5">
          <FileJson className="h-3.5 w-3.5" />
          JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>
    </div>
  )
}
