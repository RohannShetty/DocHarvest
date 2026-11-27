import React from "react"
import { 
  Globe, 
  Play, 
  Square, 
  Sliders, 
  RotateCcw, 
  Lock, 
  Copy, 
  X,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { onEnterSubmit } from "@/lib/keyboard"

export interface UrlCommandBarProps {
  url: string
  setUrl: (url: string) => void
  detecting: boolean
  detectedProvider: string | null
  detectedVersions: string[]
  selectedVersions: string[]
  onToggleVersion: (version: string) => void
  isCapturing: boolean
  onStart: () => void
  onCancel: () => void
  onOpenConfig: () => void
  configOpen: boolean
  hasActiveLocks: boolean
  onForceReset: () => void
}

export const UrlCommandBar: React.FC<UrlCommandBarProps> = ({
  url,
  setUrl,
  detecting,
  detectedProvider,
  detectedVersions,
  selectedVersions,
  onToggleVersion,
  isCapturing,
  onStart,
  onCancel,
  onOpenConfig,
  configOpen,
  hasActiveLocks,
  onForceReset,
}) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setUrl(text.trim())
    } catch {
      toast.error("Could not read clipboard")
    }
  }

  return (
    <div className="flex flex-col gap-3 font-sans">
      {hasActiveLocks && (
        <div className="flex items-center justify-between border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-destructive">
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Active crawl lock detected for this domain. Another worker may be in progress.</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onForceReset}
            className="h-7 text-xs text-destructive hover:bg-destructive/20 font-mono"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
            Force Unlock
          </Button>
        </div>
      )}

      {/* Main Command Bar Input */}
      <div className="relative flex items-center border border-border bg-card">
        <div className="flex h-11 w-11 items-center justify-center text-muted-foreground border-r border-border shrink-0">
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.5} />
          ) : (
            <Globe className="h-4 w-4" strokeWidth={1.5} />
          )}
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => onEnterSubmit(e, onStart)}
          disabled={isCapturing}
          placeholder="https://docs.example.com or any documentation root URL..."
          className="h-11 flex-1 bg-transparent px-3 text-xs md:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {url && !isCapturing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUrl("")}
            className="h-11 w-11 text-muted-foreground hover:text-foreground shrink-0"
            title="Clear input"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        )}

        {!url && !isCapturing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePaste}
            className="h-11 w-11 text-muted-foreground hover:text-foreground shrink-0"
            title="Paste from clipboard"
          >
            <Copy className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenConfig}
          disabled={isCapturing}
          className={`h-11 w-11 border-l border-border shrink-0 ${
            configOpen ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle crawl configuration"
        >
          <Sliders className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        {isCapturing ? (
          <Button
            onClick={onCancel}
            className="h-11 px-5 border-l border-border bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium shrink-0"
          >
            <Square className="h-3.5 w-3.5 mr-1.5 fill-current" strokeWidth={1.5} />
            Abort
          </Button>
        ) : (
          <Button
            onClick={onStart}
            disabled={!url.trim()}
            className="h-11 px-5 border-l border-border bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shrink-0"
          >
            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" strokeWidth={1.5} />
            Capture
          </Button>
        )}
      </div>

      {/* Inline Detected Metadata Chips */}
      {(detectedProvider || detectedVersions.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {detectedProvider && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span className="text-muted-foreground">Engine:</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30 text-primary bg-primary/10 font-mono">
                {detectedProvider}
              </Badge>
            </div>
          )}

          {detectedVersions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-mono">Versions:</span>
              {detectedVersions.map((v) => {
                const isSelected = selectedVersions.includes(v)
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onToggleVersion(v)}
                    className={`px-2 py-0.5 text-xs font-mono border transition-colors ${
                      isSelected
                        ? "border-primary/40 bg-primary/10 text-primary font-medium"
                        : "border-border bg-muted/10 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
