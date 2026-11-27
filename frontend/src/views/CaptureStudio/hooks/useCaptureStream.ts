import { useState, useEffect, useRef, useCallback } from "react"
import { pyApi, CaptureProgressPayload, CaptureDonePayload } from "@/lib/bridge"
import { RingBuffer } from "./ringBuffer"
import { LogEntry, LiveTelemetry } from "../types"
import { BatchController } from "@/lib/batch"
import { toast } from "sonner"

export interface UseCaptureStreamOptions {
  onCaptureCompleted: () => void
  batchControllerRef?: React.MutableRefObject<BatchController>
  isBatchRunning?: () => boolean
}

export function useCaptureStream(options: UseCaptureStreamOptions) {
  const { onCaptureCompleted, batchControllerRef, isBatchRunning } = options

  const ringBufferRef = useRef<RingBuffer<LogEntry>>(new RingBuffer<LogEntry>(5000))
  const [logs, setLogs] = useState<LogEntry[]>([])
  const dirtyLogsRef = useRef<boolean>(false)
  const rafIdRef = useRef<number | null>(null)

  // Telemetry state
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    elapsedSec: 0,
    discovered: 0,
    downloaded: 0,
    failed: 0,
    currentUrl: undefined,
    progressPct: 0,
  })

  // Capture execution flags
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [lastDomain, setLastDomain] = useState<string>("")

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capturingRef = useRef<boolean>(false)

  // Synchronize rAF flush loop
  useEffect(() => {
    let active = true

    const loop = () => {
      if (!active) return
      if (dirtyLogsRef.current) {
        setLogs(ringBufferRef.current.toArray())
        dirtyLogsRef.current = false
      }
      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)

    return () => {
      active = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  // Append a log entry to ring buffer and flag for next rAF paint
  const appendLog = useCallback((entry: Omit<LogEntry, "id" | "time">) => {
    const fullEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      ...entry,
    }
    ringBufferRef.current.push(fullEntry)
    dirtyLogsRef.current = true
  }, [])

  const clearLogs = useCallback(() => {
    ringBufferRef.current.clear()
    setLogs([])
    dirtyLogsRef.current = false
  }, [])

  // Register bridge callbacks
  useEffect(() => {
    window.onCaptureProgress = (data: CaptureProgressPayload) => {
      setTelemetry((prev) => ({
        ...prev,
        discovered: typeof data.discovered === "number" ? data.discovered : prev.discovered,
        downloaded: typeof data.downloaded === "number" ? data.downloaded : prev.downloaded,
        failed: typeof data.failed === "number" ? data.failed : prev.failed,
        progressPct: typeof data.percent === "number" ? Math.min(100, Math.max(0, data.percent)) : prev.progressPct,
        currentUrl: data.url || prev.currentUrl,
      }))

      let level: LogEntry["level"] = "info"
      if (data.kind === "downloaded") level = "downloaded"
      else if (data.kind === "discovered") level = "discovered"
      else if (data.kind === "failed") level = "error"
      else if (data.kind === "written") level = "written"

      const message =
        data.message ||
        (data.title ? `Downloaded: ${data.title}` : data.url || "Processing...")

      appendLog({
        level,
        url: data.url,
        title: data.title,
        message,
      })
    }

    window.onCaptureDone = (data: CaptureDonePayload) => {
      if (timerRef.current) clearInterval(timerRef.current)
      capturingRef.current = false

      if (isBatchRunning?.() && batchControllerRef?.current) {
        batchControllerRef.current.markComplete(data)
        return
      }

      setIsCapturing(false)
      if (data.success) {
        setIsComplete(true)
        setCaptureError(null)
        setTelemetry((prev) => ({ ...prev, progressPct: 100 }))
        toast.success(
          `Documentation capture complete! ${data.pages_downloaded || 0} pages saved to Library.`
        )
      } else {
        setIsComplete(false)
        if (data.cancelled) {
          toast.warning("Capture canceled by user.")
          setCaptureError("Capture was cancelled before finishing.")
        } else {
          const err = data.error || "Capture encountered an error."
          setCaptureError(err)
          toast.error(`Capture failed: ${err}`)
        }
      }
      onCaptureCompleted()
    }

    return () => {
      window.onCaptureProgress = undefined
      window.onCaptureDone = undefined
    }
  }, [appendLog, onCaptureCompleted, isBatchRunning, batchControllerRef])

  const startCapture = useCallback(
    async (crawlUrl: string, apiOptions: any): Promise<boolean> => {
      const trimmed = crawlUrl.trim()
      if (!trimmed) {
        toast.error("Please enter a valid documentation URL")
        return false
      }

      try {
        const u = new URL(trimmed)
        setLastDomain(u.hostname.replace("www.", ""))
      } catch {
        setLastDomain(trimmed)
      }

      setIsCapturing(true)
      capturingRef.current = true
      setIsComplete(false)
      setCaptureError(null)
      clearLogs()
      setTelemetry({
        elapsedSec: 0,
        discovered: 0,
        downloaded: 0,
        failed: 0,
        currentUrl: undefined,
        progressPct: 0,
      })

      if (timerRef.current) clearInterval(timerRef.current)
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startTime) / 1000)
        setTelemetry((prev) => ({ ...prev, elapsedSec: sec }))
      }, 1000)

      try {
        const res = await pyApi.startCapture(trimmed, apiOptions)
        if (!res.success) {
          toast.error(`Could not start capture: ${res.error}`)
          setIsCapturing(false)
          capturingRef.current = false
          setCaptureError(res.error)
          if (timerRef.current) clearInterval(timerRef.current)
          return false
        }
        toast.info("Crawl engine started in background")
        return true
      } catch (err: any) {
        toast.error(`Error: ${err.message}`)
        setIsCapturing(false)
        capturingRef.current = false
        setCaptureError(err.message)
        if (timerRef.current) clearInterval(timerRef.current)
        return false
      }
    },
    [clearLogs]
  )

  const cancelCapture = useCallback(async () => {
    toast.warning("Aborting capture thread...")
    try {
      await pyApi.cancelCapture()
    } catch {
      // Ignore
    }
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const forceReset = useCallback(async () => {
    try {
      const res = await pyApi.resetCapture()
      if (res.success) {
        if (res.worker_still_running) {
          capturingRef.current = true
          setIsCapturing(true)
          setIsComplete(false)
          setCaptureError(null)
          toast.warning(
            "A capture worker is still running. State kept busy and locks preserved; try again shortly."
          )
          return
        }
        toast.success(
          `Cleared capture state and released ${res.cleared_locks ?? 0} active lock(s).`
        )
        setCaptureError(null)
        setIsCapturing(false)
        capturingRef.current = false
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        toast.error("Failed to reset capture state.")
      }
    } catch (err: any) {
      toast.error(`Error resetting: ${err.message}`)
    }
  }, [])

  return {
    logs,
    telemetry,
    isCapturing,
    isComplete,
    captureError,
    lastDomain,
    startCapture,
    cancelCapture,
    forceReset,
    appendLog,
    clearLogs,
    capturingRef,
    setTelemetry,
    setIsCapturing,
    setIsComplete,
    setLastDomain,
    timerRef,
  }
}
