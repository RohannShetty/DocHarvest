import React from "react"
import { LiveTelemetry } from "../types"

export interface TelemetryStripProps {
  telemetry: LiveTelemetry
  isCapturing: boolean
  workers: number
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  telemetry,
  isCapturing,
  workers,
}) => {
  const { elapsedSec, discovered, downloaded, failed, currentUrl, progressPct } = telemetry

  const speedPagesPerSec = elapsedSec > 0 && downloaded > 0
    ? (downloaded / elapsedSec).toFixed(1)
    : "0.0"

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const rem = sec % 60
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`
  }

  return (
    <div className="border border-border bg-card font-sans">
      {/* Hairline Progress Indicator */}
      <div className="relative h-[2px] w-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Discovered */}
        <div className="px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Discovered
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
              {discovered}
            </span>
            <span className="text-xs text-muted-foreground font-mono">URLs</span>
          </div>
        </div>

        {/* Downloaded */}
        <div className="px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Indexed
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-semibold tabular-nums text-primary">
              {downloaded}
            </span>
            <span className="text-xs text-muted-foreground font-mono">pages</span>
          </div>
        </div>

        {/* Failed */}
        <div className="px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Failed / Skipped
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-mono text-xl font-semibold tabular-nums ${
                failed > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {failed}
            </span>
            <span className="text-xs text-muted-foreground font-mono">errors</span>
          </div>
        </div>

        {/* Elapsed & Speed */}
        <div className="px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Time & Throughput
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
              {formatElapsed(elapsedSec)}
            </span>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              {speedPagesPerSec} p/s ({workers}w)
            </span>
          </div>
        </div>
      </div>

      {/* Realtime URL Line */}
      {isCapturing && currentUrl && (
        <div className="border-t border-border px-4 py-1.5 flex items-center gap-2 text-xs bg-muted/10">
          <div className="h-1.5 w-1.5 rounded-none bg-primary animate-ping shrink-0" />
          <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-mono shrink-0">
            Fetching:
          </span>
          <span className="font-mono text-xs text-foreground truncate">{currentUrl}</span>
        </div>
      )}
    </div>
  )
}
