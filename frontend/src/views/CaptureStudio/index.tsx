import React, { useState, useCallback } from "react"
import { useCaptureConfig } from "./hooks/useCaptureConfig"
import { useCaptureStream } from "./hooks/useCaptureStream"
import { useBatchQueue } from "./hooks/useBatchQueue"
import { UrlCommandBar } from "./components/UrlCommandBar"
import { CrawlConfigPanel } from "./components/CrawlConfigPanel"
import { TelemetryStrip } from "./components/TelemetryStrip"
import { LiveLogStream } from "./components/LiveLogStream"
import { CompletionBanner } from "./components/CompletionBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Download } from "lucide-react"

export interface CaptureStudioProps {
  onCaptureCompleted: () => void
  onOpenDocReader: (domain: string) => void
  onOpenDiff?: (domain: string) => void
  onOpenExport?: (domain: string) => void
}

export const CaptureStudio: React.FC<CaptureStudioProps> = ({
  onCaptureCompleted,
  onOpenDocReader,
  onOpenDiff,
  onOpenExport,
}) => {
  const [configOpen, setConfigOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<"single" | "batch">("single")
  const [autoScroll, setAutoScroll] = useState(true)

  const config = useCaptureConfig()

  const stream = useCaptureStream({
    onCaptureCompleted,
    batchControllerRef: undefined, // wired by batch queue when batch runs
    isBatchRunning: () => batch.batchRunning,
  })

  const batch = useBatchQueue({
    onCaptureCompleted,
    onAppendLog: stream.appendLog,
    onClearLogs: stream.clearLogs,
    onSetIsCapturing: stream.setIsCapturing,
    onSetIsComplete: stream.setIsComplete,
    onSetLastDomain: stream.setLastDomain,
    onResetTelemetry: () =>
      stream.setTelemetry({ elapsedSec: 0, discovered: 0, downloaded: 0, failed: 0, progressPct: 0 }),
    capturingRef: stream.capturingRef,
    timerRef: stream.timerRef,
  })

  const handleRunBatch = useCallback(() => {
    void batch.runBatch(config.getApiOptions)
  }, [batch, config])

  const handleCancelBatch = useCallback(() => {
    void batch.cancelBatch()
  }, [batch])

  const handleStart = useCallback(() => {
    if (activeMode === "batch") {
      handleRunBatch()
    } else {
      void stream.startCapture(config.url, config.getApiOptions())
    }
  }, [activeMode, handleRunBatch, stream, config])

  const handleCancel = useCallback(() => {
    if (activeMode === "batch") {
      handleCancelBatch()
    } else {
      void stream.cancelCapture()
    }
  }, [activeMode, handleCancelBatch, stream])

  const hasLocks = Boolean(config.lockStatus?.has_active_locks || config.lockStatus?.domain_locked)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full font-sans animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-foreground font-sans">Capture Studio</h2>
        </div>
        <div className="flex items-center border border-border">
          <button
            onClick={() => setActiveMode("single")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${activeMode === "single" ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Single URL
          </button>
          <button
            onClick={() => setActiveMode("batch")}
            className={`px-3 py-1 text-xs font-medium transition-colors border-l border-border ${activeMode === "batch" ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Batch Queue ({batch.batchUrls.length})
          </button>
        </div>
      </div>

      {activeMode === "batch" && (
        <div className="border border-border bg-card p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              value={batch.newBatchUrl}
              onChange={(e) => batch.setNewBatchUrl(e.target.value)}
              placeholder="Add documentation URL to batch queue..."
              className="h-9 font-mono text-xs border-border bg-background"
            />
            <Button onClick={() => batch.addBatchUrl()} className="h-9 px-3 text-xs bg-primary text-primary-foreground font-medium">
              <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} /> Add URL
            </Button>
          </div>
          {batch.batchUrls.length > 0 && (
            <div className="space-y-2">
              <div className="max-h-32 overflow-y-auto divide-y divide-border border border-border text-xs font-mono">
                {batch.batchUrls.map((u, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-1.5 ${batch.batchRunning && batch.batchIndex === i ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                    <span className="truncate">{i + 1}. {u}</span>
                    {!batch.batchRunning && (
                      <Button variant="ghost" size="icon" onClick={() => batch.removeBatchUrl(i)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                {batch.batchRunning ? (
                  <Button
                    onClick={handleCancelBatch}
                    variant="destructive"
                    className="h-8 px-3 text-xs font-medium"
                  >
                    Cancel Batch
                  </Button>
                ) : (
                  <Button
                    onClick={handleRunBatch}
                    disabled={batch.batchUrls.length === 0}
                    className="h-8 px-3 text-xs bg-primary text-primary-foreground font-medium"
                  >
                    Run Batch
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <UrlCommandBar
        url={config.url}
        setUrl={config.setUrl}
        detecting={config.detecting}
        detectedProvider={config.detectedProvider}
        detectedVersions={config.detectedVersions}
        selectedVersions={config.selectedVersions}
        onToggleVersion={config.toggleVersion}
        isCapturing={stream.isCapturing}
        onStart={handleStart}
        onCancel={handleCancel}
        onOpenConfig={() => setConfigOpen(!configOpen)}
        configOpen={configOpen}
        hasActiveLocks={hasLocks}
        onForceReset={stream.forceReset}
      />

      <CrawlConfigPanel
        workers={config.workers}
        setWorkers={config.setWorkers}
        maxPages={config.maxPages}
        setMaxPages={config.setMaxPages}
        pathScope={config.pathScope}
        setPathScope={config.setPathScope}
        excludePaths={config.excludePaths}
        setExcludePaths={config.setExcludePaths}
        outputMode={config.outputMode}
        setOutputMode={config.setOutputMode}
        renderSpa={config.renderSpa}
        setRenderSpa={config.setRenderSpa}
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
      />

      <CompletionBanner
        isComplete={stream.isComplete}
        captureError={stream.captureError}
        lastDomain={stream.lastDomain}
        downloadedCount={stream.telemetry.downloaded}
        onOpenDocReader={onOpenDocReader}
        onOpenDiff={onOpenDiff}
        onOpenExport={onOpenExport}
        onDismiss={() => { stream.setIsComplete(false) }}
      />

      <TelemetryStrip
        telemetry={stream.telemetry}
        isCapturing={stream.isCapturing}
        workers={config.workers}
      />

      <LiveLogStream
        logs={stream.logs}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        onClear={stream.clearLogs}
      />
    </div>
  )
}
export default CaptureStudio
