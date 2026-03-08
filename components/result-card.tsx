"use client"

import { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink, Cloud, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ImageFile, OutputField } from "@/lib/types"
import { OUTPUT_FIELD_LABELS } from "@/lib/types"
import { copyToClipboard } from "@/lib/image-utils"

interface ResultCardProps {
  image: ImageFile
  enabledOutputs: OutputField[]
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  )
}

function FieldRow({ label, value, fieldKey }: { label: string; value: string | string[]; fieldKey: string }) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value
  if (!displayValue) return null

  if (fieldKey === "tags" || fieldKey === "colors") {
    const items = Array.isArray(value) ? value : [value]
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <CopyButton text={items.join(", ")} label={label} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge key={`${fieldKey}-${i}`} variant="secondary" className="text-[11px]">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <CopyButton text={displayValue} label={label} />
      </div>
      <p className="text-sm text-foreground leading-relaxed">{displayValue}</p>
    </div>
  )
}

export function ResultCard({ image, enabledOutputs }: ResultCardProps) {
  const [expanded, setExpanded] = useState(true)

  if (!image.result) return null

  const handleCopyAll = async () => {
    const parts: string[] = [image.file.name]
    if (image.blobUrl) {
      parts.push(`Image URL: ${image.blobUrl}`)
    }
    const fieldTexts = enabledOutputs
      .map((field) => {
        const val = image.result?.[field]
        const display = Array.isArray(val) ? val.join(", ") : val
        return `${OUTPUT_FIELD_LABELS[field]}: ${display}`
      })
      .join("\n\n")
    parts.push(fieldTexts)

    await copyToClipboard(parts.join("\n\n"))
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.blobUrl || image.preview}
            alt={image.file.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate text-balance">
            {image.result.title || image.file.name}
          </h3>
          {enabledOutputs.includes("shortDescription") && image.result.shortDescription && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {image.result.shortDescription}
            </p>
          )}
          {/* Status indicators */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {image.blobUrl && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Cloud className="h-3 w-3 text-primary" />
                Blob
              </Badge>
            )}
            {image.searchIndexId && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Search className="h-3 w-3 text-primary" />
                Indexed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={handleCopyAll}>
              <Copy className="h-3 w-3 mr-1" />
              Copy All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 border-t px-4 pb-4 pt-3">
          {/* Blob URL row */}
          {image.blobUrl && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Image URL</span>
                  <CopyButton text={image.blobUrl} label="Image URL" />
                </div>
                <a
                  href={image.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
                >
                  {image.blobUrl}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              <Separator />
            </>
          )}
          {enabledOutputs.map((field, i) => {
            const value = image.result?.[field]
            if (!value || (Array.isArray(value) && value.length === 0)) return null
            return (
              <div key={field}>
                {i > 0 && <Separator className="mb-3" />}
                <FieldRow
                  label={OUTPUT_FIELD_LABELS[field]}
                  value={value}
                  fieldKey={field}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
