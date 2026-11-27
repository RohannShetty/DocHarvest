import React from "react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CrawlConfigPanelProps {
  workers: number
  setWorkers: (w: number) => void
  maxPages: number | string
  setMaxPages: (m: number | string) => void
  pathScope: string
  setPathScope: (s: string) => void
  excludePaths: string
  setExcludePaths: (e: string) => void
  outputMode: "library" | "local" | "both"
  setOutputMode: (m: "library" | "local" | "both") => void
  renderSpa: boolean
  setRenderSpa: (r: boolean) => void
  isOpen: boolean
  onClose: () => void
}

export const CrawlConfigPanel: React.FC<CrawlConfigPanelProps> = ({
  workers,
  setWorkers,
  maxPages,
  setMaxPages,
  pathScope,
  setPathScope,
  excludePaths,
  setExcludePaths,
  outputMode,
  setOutputMode,
  renderSpa,
  setRenderSpa,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className="border border-border bg-card p-4 space-y-4 font-sans animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground font-sans">
          Crawl Engine Configuration
        </h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Workers */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center justify-between">
            <span>Concurrency Workers</span>
            <span className="font-mono tabular-nums text-foreground">{workers}</span>
          </label>
          <Input
            type="number"
            min={1}
            max={32}
            value={workers}
            onChange={(e) => setWorkers(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="h-8 font-mono text-xs border-border bg-background"
          />
          <p className="text-muted-foreground text-[11px]">Parallel requests per crawl session</p>
        </div>

        {/* Max Pages */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium">Max Pages (Budget)</label>
          <Input
            type="number"
            min={1}
            placeholder="Unlimited"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="h-8 font-mono text-xs border-border bg-background"
          />
          <p className="text-muted-foreground text-[11px]">Leave empty for exhaustive site crawl</p>
        </div>

        {/* Output Mode */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium">Persistence Target</label>
          <select
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as "library" | "local" | "both")}
            className="h-8 w-full border border-border bg-background px-2.5 text-xs text-foreground font-mono focus:outline-none"
          >
            <option value="library">Library Only (~/.docharvest)</option>
            <option value="both">Both (Library + Local Workspace)</option>
            <option value="local">Local Directory Only</option>
          </select>
          <p className="text-muted-foreground text-[11px]">Where extracted markdown is saved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1 border-t border-border">
        {/* Path Scope */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium">Path Scope (Prefix)</label>
          <Input
            type="text"
            placeholder="/docs, /api"
            value={pathScope}
            onChange={(e) => setPathScope(e.target.value)}
            className="h-8 font-mono text-xs border-border bg-background"
          />
          <p className="text-muted-foreground text-[11px]">Only crawl paths starting with this prefix</p>
        </div>

        {/* Exclude Paths */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium">Exclude Patterns</label>
          <Input
            type="text"
            placeholder="changelog, blog, archive"
            value={excludePaths}
            onChange={(e) => setExcludePaths(e.target.value)}
            className="h-8 font-mono text-xs border-border bg-background"
          />
          <p className="text-muted-foreground text-[11px]">Comma-separated URL substrings to skip</p>
        </div>
      </div>

      {/* Headless SPA Render */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-foreground">Client-Side SPA Headless Render</div>
          <div className="text-muted-foreground text-[11px]">
            Uses headless browser rendering for JS-heavy or client-rendered pages
          </div>
        </div>
        <Switch checked={renderSpa} onCheckedChange={setRenderSpa} />
      </div>
    </div>
  )
}
