import { useState, useEffect, useRef, useCallback } from "react"

export interface VirtualizerOptions {
  totalItems: number
  itemHeight: number
  overscan?: number
}

export interface VirtualItem {
  index: number
  offsetY: number
}

export function useVirtualizer(options: VirtualizerOptions) {
  const { totalItems, itemHeight, overscan = 5 } = options
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [viewportHeight, setViewportHeight] = useState<number>(400)
  const scrollElementRef = useRef<HTMLDivElement | null>(null)

  const onScroll = useCallback(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const el = scrollElementRef.current
    if (!el) return

    setViewportHeight(el.clientHeight)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height)
      }
    })
    resizeObserver.observe(el)
    el.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      resizeObserver.disconnect()
      el.removeEventListener("scroll", onScroll)
    }
  }, [onScroll])

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
  )

  const virtualItems: VirtualItem[] = []
  for (let i = startIndex; i < endIndex; i++) {
    virtualItems.push({
      index: i,
      offsetY: i * itemHeight,
    })
  }

  const totalHeight = totalItems * itemHeight

  const scrollToEnd = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight
    }
  }, [])

  return {
    scrollElementRef,
    virtualItems,
    totalHeight,
    scrollToEnd,
    startIndex,
    endIndex,
  }
}
