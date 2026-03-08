"use client"

import { Settings2, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type {
  ProviderConfig,
  ProviderType,
  ToneOption,
  OutputField,
} from "@/lib/types"
import {
  TONE_DESCRIPTIONS,
  OUTPUT_FIELD_LABELS,
  GATEWAY_MODELS,
} from "@/lib/types"

interface SettingsPanelProps {
  config: ProviderConfig
  onChange: (config: ProviderConfig) => void
}

const PROVIDER_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "gateway", label: "Vercel AI Gateway" },
  { value: "ollama", label: "Ollama (Local)" },
  { value: "custom", label: "Custom OpenAI-Compatible" },
]

const TONE_OPTIONS: ToneOption[] = [
  "neutral",
  "professional",
  "casual",
  "creative",
  "technical",
  "marketing",
]

export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const update = (partial: Partial<ProviderConfig>) => {
    onChange({ ...config, ...partial })
  }

  const toggleOutput = (field: OutputField) => {
    const current = config.enabledOutputs
    if (current.includes(field)) {
      if (current.length <= 1) return
      update({ enabledOutputs: current.filter((f) => f !== field) })
    } else {
      update({ enabledOutputs: [...current, field] })
    }
  }

  const allOutputFields = Object.keys(OUTPUT_FIELD_LABELS) as OutputField[]

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Analysis Settings</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-5 border-t px-4 pb-5 pt-4">
          {/* Provider */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Provider</Label>
            <Select
              value={config.type}
              onValueChange={(v) =>
                update({
                  type: v as ProviderType,
                  model: v === "gateway" ? "openai/gpt-4o" : v === "ollama" ? "llava" : "",
                  baseUrl: v === "ollama" ? "http://localhost:11434/v1" : "",
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Model</Label>
            {config.type === "gateway" ? (
              <Select value={config.model} onValueChange={(v) => update({ model: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATEWAY_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={config.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder={config.type === "ollama" ? "llava" : "model-name"}
                className="text-sm"
              />
            )}
          </div>

          {/* Base URL for Ollama / Custom */}
          {(config.type === "ollama" || config.type === "custom") && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">Base URL</Label>
              <Input
                value={config.baseUrl || ""}
                onChange={(e) => update({ baseUrl: e.target.value })}
                placeholder={
                  config.type === "ollama"
                    ? "http://localhost:11434/v1"
                    : "https://api.example.com/v1"
                }
                className="text-sm"
              />
            </div>
          )}

          {/* API Key for Custom */}
          {config.type === "custom" && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
              <Input
                type="password"
                value={config.apiKey || ""}
                onChange={(e) => update({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="text-sm"
              />
            </div>
          )}

          <Separator />

          {/* System Message */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">System Message</Label>
            <Textarea
              value={config.systemMessage}
              onChange={(e) => update({ systemMessage: e.target.value })}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Description Tone</Label>
            <Select value={config.tone} onValueChange={(v) => update({ tone: v as ToneOption })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="capitalize">{t}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {"- "}
                      {TONE_DESCRIPTIONS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Output Fields */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Output Fields</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => update({ enabledOutputs: [...allOutputFields] })}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => update({ enabledOutputs: ["title"] })}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {allOutputFields.map((field) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={config.enabledOutputs.includes(field)}
                    onCheckedChange={() => toggleOutput(field)}
                  />
                  <span className="text-xs text-foreground">{OUTPUT_FIELD_LABELS[field]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
