import { useState, useEffect, useCallback, useRef } from "react"
import { pyApi } from "@/lib/bridge"

export interface LibraryItem {
  domain: string
  source_url?: string
  total_pages?: number
  pages_count?: number
  created_at?: string
  last_captured?: string
  size_bytes?: number
  provider?: string
  versions?: string[]
  snapshots?: string[]
  [key: string]: any
}

export function useLibrary() {
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(false)
  const isFetchingRef = useRef<boolean>(false)

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoadingLibrary(true)
    try {
      const items = await pyApi.listLibrary()
      setLibrary(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error("Failed to load library:", err)
    } finally {
      setLoadingLibrary(false)
      isFetchingRef.current = false
    }
  }, [])

  const invalidate = useCallback(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    library,
    loadingLibrary,
    refresh,
    invalidate,
  }
}
