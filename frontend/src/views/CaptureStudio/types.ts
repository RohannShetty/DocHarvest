export interface CaptureConfig {
  readonly workers: number
  readonly maxPages?: number
  readonly pathScope: string[]
  readonly excludePaths: string[]
  readonly siteVersions?: string[]
  readonly renderSpa: boolean
  readonly outputMode: "library" | "local" | "both"
}

export interface LiveTelemetry {
  readonly elapsedSec: number
  readonly discovered: number
  readonly downloaded: number
  readonly failed: number
  readonly currentUrl?: string
  readonly progressPct: number
}

export interface LogEntry {
  readonly id: string
  readonly time: string
  readonly level: "info" | "downloaded" | "discovered" | "error" | "warn" | "written"
  readonly url?: string
  readonly title?: string
  readonly message: string
}
