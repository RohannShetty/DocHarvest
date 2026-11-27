import { useState, useEffect, useCallback } from "react"
import { pyApi } from "@/lib/bridge"
import { toggleVersionSelection } from "@/lib/flow"

export interface LockStatus {
  success?: boolean
  has_active_locks?: boolean
  domain_locked?: boolean
  active_locks?: Array<{ domain: string; pid?: number; created_at?: string }>
  [key: string]: unknown
}

export function useCaptureConfig() {
  const [url, setUrl] = useState<string>("")
  const [detecting, setDetecting] = useState<boolean>(false)
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null)
  const [detectedVersions, setDetectedVersions] = useState<string[]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  // Options
  const [maxPages, setMaxPages] = useState<number | string>("")
  const [workers, setWorkers] = useState<number>(5)
  const [pathScope, setPathScope] = useState<string>("")
  const [excludePaths, setExcludePaths] = useState<string>("")
  const [outputMode, setOutputMode] = useState<"library" | "local" | "both">("library")
  const [renderSpa, setRenderSpa] = useState<boolean>(false)

  // Locks
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null)

  const refreshLockStatus = useCallback(async (targetDomain?: string) => {
    try {
      const res = await pyApi.getLockStatus(targetDomain || url)
      if (res && res.success) {
        setLockStatus(res)
      }
    } catch {
      // Ignore background lock status fetch errors
    }
  }, [url])

  useEffect(() => {
    void refreshLockStatus()
  }, [refreshLockStatus])

  // Debounced URL detection
  useEffect(() => {
    const trimmed = url.trim()
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setDetectedProvider(null)
      setDetectedVersions([])
      setSelectedVersions([])
      return
    }

    void refreshLockStatus(trimmed)

    const timer = setTimeout(async () => {
      setDetecting(true)
      try {
        const res = await pyApi.detect(trimmed)
        if (res.success || res.detected) {
          setDetectedProvider(res.provider || "generic")
          const versions = Array.isArray(res.site_versions) ? res.site_versions : []
          setDetectedVersions(versions)
          setSelectedVersions(versions)
        } else {
          setDetectedProvider(null)
        }
      } catch {
        setDetectedProvider(null)
      } finally {
        setDetecting(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [url, refreshLockStatus])

  const handleToggleVersion = useCallback((version: string) => {
    setSelectedVersions((prev) => toggleVersionSelection(prev, version))
  }, [])

  const getApiOptions = useCallback(() => {
    return {
      max_pages: maxPages ? parseInt(String(maxPages), 10) : null,
      workers: workers || 5,
      path_scope: pathScope.trim() || null,
      exclude_paths: excludePaths.trim() || null,
      output_mode: outputMode || "library",
      site_versions: selectedVersions.length > 0 ? selectedVersions : null,
      render: renderSpa,
    }
  }, [maxPages, workers, pathScope, excludePaths, outputMode, selectedVersions, renderSpa])

  return {
    url,
    setUrl,
    detecting,
    detectedProvider,
    detectedVersions,
    selectedVersions,
    toggleVersion: handleToggleVersion,
    maxPages,
    setMaxPages,
    workers,
    setWorkers,
    pathScope,
    setPathScope,
    excludePaths,
    setExcludePaths,
    outputMode,
    setOutputMode,
    renderSpa,
    setRenderSpa,
    lockStatus,
    refreshLockStatus,
    getApiOptions,
  }
}
