import React, { useState, useMemo, useEffect } from "react"
import { LogEntry } from "../types"
import { useVirtualizer } from "../hooks/useVirtualizer"
import { 
  Terminal, 
  Copy, 
  Trash2, 
  Check, 
  ArrowDownToLine, 
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export interface LiveLogStreamProps {
  logs: LogEntry[]
  autoScroll: boolean
  setAutoScroll: (val: boolean) => void
  onClear: () => void
}

type LogFilter = "all" | "downloaded" | "discovered" | "error"

export const LiveLogStream: React.FC<LiveLogStreamProps> = ({
  logs,
  autoScroll,
  setAutoScroll,
  onClear,
}) => {
  const [filter, setFilter] = useState<LogFilter>("all")
  const [search, setSearch] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filter === "downloaded" && log.level !== "downloaded") return false
      if (filter === "discovered" && log.level !== "discovered") return false
      if (filter === "error" && log.level !== "error") return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          log.message.toLowerCase().includes(q) ||
          (log.url && log.url.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [logs, filter, search])

  const { scrollElementRef, virtualItems, totalHeight, scrollToEnd } = useVirtualizer({
    totalItems: filteredLogs.length,
    itemHeight: 24,
    overscan: 10,
  })

  // Auto-scroll on new entries if enabled
  useEffect(() => {
    if (autoScroll) {
      scrollToEnd()
    }
  }, [filteredLogs.length, autoScroll, scrollToEnd])

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map((l) => `[${l.time}] [${l.level.toUpperCase()}] ${l.message} ${l.url || ""}`)
      .join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Logs copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy logs")
    }
  }

  const renderLevelTag = (level: LogEntry["level"]) => {
    switch (level) {
      case "downloaded":
        return <span className="text-primary font-mono font-semibold shrink-0">[SAVED]</span>
      case "discovered":
        return <span className="text-muted-foreground font-mono shrink-0">[DISC]</span>
      case "error":
        return <span className="text-destructive font-mono font-semibold shrink-0">[FAIL]</span>
      case "written":
        return <span className="text-foreground font-mono shrink-0">[SYNC]</span>
      default:
        return <span className="text-muted-foreground font-mono shrink-0">[INFO]</span>
    }
  }

  return (
    <div className="flex flex-col border border-border bg-card font-mono text-xs">
      {/* Terminal Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="font-semibold text-foreground font-sans text-xs">Crawl Stream</span>
          <span className="text-muted-foreground text-[11px] tabular-nums font-mono">
            ({filteredLogs.length} of {logs.length})
          </span>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="h-3 w-3 text-muted-foreground absolute left-2 pointer-events-none" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs..."
              className="h-7 w-32 md:w-44 border border-border bg-background pl-6 pr-2 text-[11px] text-foreground font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center border border-border">
            {(["all", "downloaded", "discovered", "error"] as LogFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[11px] font-mono transition-colors uppercase ${
                  filter === f
                    ? "bg-accent/50 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`h-7 w-7 ${autoScroll ? "text-primary" : "text-muted-foreground"}`}
              title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
            >
              <ArrowDownToLine className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyLogs}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Copy visible logs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Clear log buffer"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      {/* Virtualized Container (CSS contain: strict, fixed 24px rows) */}
      <div
        ref={scrollElementRef}
        style={{ contain: "strict" }}
        className="h-80 w-full overflow-y-auto bg-background/50 p-2 font-mono text-[11px]"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs font-sans">
            No log entries matching filter criteria.
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: "relative", width: "100%" }}>
            {virtualItems.map((item) => {
              const log = filteredLogs[item.index]
              if (!log) return null
              return (
                <div
                  key={log.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "24px",
                    transform: `translateY(${item.offsetY}px)`,
                  }}
                  className="flex items-center gap-2 px-1 hover:bg-muted/20 truncate"
                >
                  <span className="text-muted-foreground tabular-nums shrink-0">{log.time}</span>
                  {renderLevelTag(log.level)}
                  <span className="text-foreground truncate">{log.message}</span>
                  {log.url && <span className="text-muted-foreground/60 truncate">({log.url})</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
