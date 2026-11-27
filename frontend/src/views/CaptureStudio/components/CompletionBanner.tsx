import React from "react"
import { CheckCircle2, AlertCircle, BookOpen, GitCompare, FileUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CompletionBannerProps {
  isComplete: boolean
  captureError: string | null
  lastDomain: string
  downloadedCount: number
  onOpenDocReader: (domain: string) => void
  onOpenDiff?: (domain: string) => void
  onOpenExport?: (domain: string) => void
  onDismiss: () => void
}

export const CompletionBanner: React.FC<CompletionBannerProps> = ({
  isComplete,
  captureError,
  lastDomain,
  downloadedCount,
  onOpenDocReader,
  onOpenDiff,
  onOpenExport,
  onDismiss,
}) => {
  if (!isComplete && !captureError) return null

  if (captureError) {
    return (
      <div className="flex items-center justify-between border border-destructive/40 bg-destructive/10 p-4 font-sans text-xs animate-in fade-in-50 duration-150">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <div>
            <div className="font-semibold text-destructive">Capture Execution Halted</div>
            <div className="text-destructive/90 text-[11px] font-mono mt-0.5">{captureError}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-8 w-8 text-destructive hover:bg-destructive/20"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border bg-card p-4 font-sans text-xs animate-in fade-in-50 duration-150">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center border border-border bg-primary/10 text-primary shrink-0">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">
            Capture Completed Successfully
          </div>
          <div className="text-muted-foreground text-xs mt-0.5">
            Indexed <span className="font-mono tabular-nums text-foreground">{downloadedCount}</span> pages for{" "}
            <span className="font-mono text-foreground">{lastDomain}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onOpenDocReader(lastDomain)}
          className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          <BookOpen className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
          Read in DocReader
        </Button>

        {onOpenDiff && (
          <Button
            variant="outline"
            onClick={() => onOpenDiff(lastDomain)}
            className="h-8 px-3 text-xs border-border hover:bg-accent hover:text-foreground font-medium"
          >
            <GitCompare className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" strokeWidth={1.5} />
            Graph & Diff
          </Button>
        )}

        {onOpenExport && (
          <Button
            variant="outline"
            onClick={() => onOpenExport(lastDomain)}
            className="h-8 px-3 text-xs border-border hover:bg-accent hover:text-foreground font-medium"
          >
            <FileUp className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" strokeWidth={1.5} />
            Export RAG
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-8 w-8 text-muted-foreground hover:text-foreground ml-1"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  )
}
