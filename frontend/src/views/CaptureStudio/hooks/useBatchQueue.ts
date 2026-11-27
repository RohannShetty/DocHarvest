import { useState, useRef, useCallback } from "react"
import { BatchController } from "@/lib/batch"
import { pyApi } from "@/lib/bridge"
import { toast } from "sonner"
import { LogEntry } from "../types"

export interface UseBatchQueueOptions {
  onCaptureCompleted: () => void
  onAppendLog: (entry: Omit<LogEntry, "id" | "time">) => void
  onClearLogs: () => void
  onSetIsCapturing: (val: boolean) => void
  onSetIsComplete: (val: boolean) => void
  onSetLastDomain: (val: string) => void
  onResetTelemetry: () => void
  capturingRef: React.MutableRefObject<boolean>
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
}

export function useBatchQueue(options: UseBatchQueueOptions) {
  const {
    onCaptureCompleted,
    onAppendLog,
    onClearLogs,
    onSetIsCapturing,
    onSetIsComplete,
    onSetLastDomain,
    onResetTelemetry,
    capturingRef,
    timerRef,
  } = options

  const [batchUrls, setBatchUrls] = useState<string[]>([])
  const [newBatchUrl, setNewBatchUrl] = useState<string>("")
  const [batchRunning, setBatchRunning] = useState<boolean>(false)
  const [batchIndex, setBatchIndex] = useState<number>(0)

  const batchControllerRef = useRef<BatchController>(new BatchController())
  const batchRunningRef = useRef<boolean>(false)
  const batchCancelRef = useRef<boolean>(false)

  const addBatchUrl = useCallback((targetUrl?: string) => {
    const toAdd = (targetUrl || newBatchUrl).trim()
    if (toAdd) {
      setBatchUrls((prev) => [...prev, toAdd])
      setNewBatchUrl("")
      toast.success("Added URL to batch queue")
    }
  }, [newBatchUrl])

  const removeBatchUrl = useCallback((index: number) => {
    setBatchUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const runBatch = useCallback(
    async (getOptions: () => Record<string, unknown>) => {
      if (batchUrls.length === 0) return
      if (capturingRef.current || batchRunningRef.current) {
        toast.error("A capture is already running. Wait for it to finish or cancel it first.")
        return
      }

      batchRunningRef.current = true
      setBatchRunning(true)
      setBatchIndex(0)
      batchCancelRef.current = false

      onSetIsCapturing(true)
      onSetIsComplete(false)
      onClearLogs()
      onResetTelemetry()

      try {
        const u = new URL(batchUrls[0].trim())
        onSetLastDomain(u.hostname.replace("www.", ""))
      } catch {
        onSetLastDomain(batchUrls[0].trim())
      }

      const apiOptions = getOptions()

      const driver = {
        start: async (batchUrl: string) => {
          capturingRef.current = true
          try {
            const res = await pyApi.startCapture(batchUrl, apiOptions)
            if (!res.success) capturingRef.current = false
            return res
          } catch (err) {
            capturingRef.current = false
            throw err
          }
        },
        cancel: async () => {
          try {
            await pyApi.cancelCapture()
          } catch {
            // ignore
          }
        },
      }

      const outcome = await batchControllerRef.current.run(batchUrls, driver, {
        timeoutMs: 10 * 60 * 1000,
        isCancelled: () => batchCancelRef.current,
        onEvent: (event) => {
          setBatchIndex(event.index)
          if (event.kind === "started") {
            onAppendLog({
              level: "discovered",
              url: event.url,
              message: `Batch: started ${event.url}`,
            })
          }
        },
      })

      batchRunningRef.current = false
      setBatchRunning(false)
      setBatchIndex(0)
      if (timerRef.current) clearInterval(timerRef.current)

      if (outcome.stoppedEarly && outcome.busy) {
        capturingRef.current = true
        onSetIsCapturing(true)
        onSetIsComplete(false)
        toast.warning(
          `Batch stopped: capture of ${outcome.results[outcome.results.length - 1]?.url} stalled and the worker is still running. Use Force Reset.`
        )
      } else if (outcome.cancelled) {
        capturingRef.current = false
        onSetIsCapturing(false)
        onSetIsComplete(false)
        if (outcome.completed > 0) onCaptureCompleted()
        toast.warning("Batch cancelled.")
      } else if (outcome.failed > 0) {
        capturingRef.current = false
        onSetIsCapturing(false)
        onSetIsComplete(false)
        if (outcome.completed > 0) onCaptureCompleted()
        toast.warning(
          `Batch finished with ${outcome.failed} failed capture(s) and ${outcome.completed} succeeded.`
        )
      } else {
        capturingRef.current = false
        onSetIsCapturing(false)
        onSetIsComplete(true)
        toast.success(`Batch complete: ${outcome.completed} capture(s) finished.`)
        onCaptureCompleted()
      }
    },
    [
      batchUrls,
      capturingRef,
      timerRef,
      onSetIsCapturing,
      onSetIsComplete,
      onClearLogs,
      onResetTelemetry,
      onSetLastDomain,
      onAppendLog,
      onCaptureCompleted,
    ]
  )

  const cancelBatch = useCallback(async () => {
    batchCancelRef.current = true
    try {
      await pyApi.cancelCapture()
    } catch {
      // ignore
    }
  }, [])

  return {
    batchUrls,
    setBatchUrls,
    newBatchUrl,
    setNewBatchUrl,
    addBatchUrl,
    removeBatchUrl,
    batchRunning,
    batchIndex,
    batchControllerRef,
    batchRunningRef,
    runBatch,
    cancelBatch,
  }
}
