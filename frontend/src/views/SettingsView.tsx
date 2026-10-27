import React, { useEffect, useMemo, useState } from "react"
import {
  Settings,
  FolderOpen,
  Save,
  RotateCcw,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { pyApi } from "@/lib/bridge"
import { toast } from "sonner"

type Scope = "global" | "project"

interface ConfigPath {
  label: string
  path: string
  exists: boolean
}

interface FormState {
  workers: string
  timeout: string
  max_pages: string
  retry_attempts: string
  min_content_chars: string
  output_mode: string
  snapshot: boolean
  render: boolean
  path_scope: string
  exclude_paths: string
}

const OUTPUT_MODES = ["both", "library", "local"] as const

// Bridge replies arrive from Python as plain objects; nothing type-checks
// them at the boundary, so narrow once instead of trusting the shape.
function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  // Safe: the runtime check above already proved this is a non-array object.
  return value as Record<string, unknown>
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

// The form keeps numbers and lists as strings so a half-typed value like "1"
// is not destroyed on every keystroke; conversion happens once, on save.
function formFromValues(values: Record<string, unknown>): FormState {
  const list = (value: unknown): string =>
    Array.isArray(value) ? value.join(", ") : value ? String(value) : ""
  return {
    workers: values.workers != null ? String(values.workers) : "",
    timeout: values.timeout != null ? String(values.timeout) : "",
    max_pages: values.max_pages != null ? String(values.max_pages) : "",
    retry_attempts: values.retry_attempts != null ? String(values.retry_attempts) : "",
    min_content_chars:
      values.min_content_chars != null ? String(values.min_content_chars) : "",
    output_mode: values.output_mode ? String(values.output_mode) : "both",
    snapshot: values.snapshot !== false,
    render: values.render === true,
    path_scope: list(values.path_scope),
    exclude_paths: list(values.exclude_paths),
  }
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

function toNumber(value: string, label: string, fallback: number): number {
  const trimmed = value.trim()
  if (!trimmed) return fallback
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`)
  }
  return parsed
}

export const SettingsView: React.FC = () => {
  const [form, setForm] = useState<FormState | null>(null)
  const [defaults, setDefaults] = useState<Record<string, unknown>>({})
  const [presets, setPresets] = useState<Record<string, Record<string, unknown>>>({})
  const [paths, setPaths] = useState<ConfigPath[]>([])
  const [scope, setScope] = useState<Scope>("global")
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const applyConfig = (payload: unknown) => {
    const res = asRecord(payload)
    if (!res || res.success !== true) {
      const detail = res && typeof res.error === "string" ? res.error : null
      setError(detail || "Could not read configuration")
      return
    }
    setError(null)
    setForm(formFromValues(asRecord(res.values) ?? {}))
    setDefaults(asRecord(res.defaults) ?? {})

    const presetTables = asRecord(res.presets) ?? {}
    setPresets(
      Object.fromEntries(
        Object.entries(presetTables).map(([name, table]) => [name, asRecord(table) ?? {}])
      )
    )

    const reported = Array.isArray(res.paths) ? res.paths : []
    // Safe: entries come from ApiBridge._config_snapshot(), which builds
    // exactly {label, path, exists}.
    setPaths(reported.filter((entry): entry is ConfigPath => asRecord(entry) !== null))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    pyApi
      .getConfig()
      .then((res) => {
        if (!cancelled) applyConfig(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const presetNames = useMemo(() => Object.keys(presets), [presets])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const payload = {
        workers: toNumber(form.workers, "Workers", 5),
        timeout: toNumber(form.timeout, "Timeout", 20),
        max_pages: toNumber(form.max_pages, "Max pages", 0),
        retry_attempts: toNumber(form.retry_attempts, "Retry attempts", 3),
        min_content_chars: toNumber(form.min_content_chars, "Minimum content", 60),
        output_mode: form.output_mode,
        snapshot: form.snapshot,
        render: form.render,
        path_scope: splitList(form.path_scope),
        exclude_paths: splitList(form.exclude_paths),
      }
      const res = await pyApi.saveConfig(payload, scope)
      const reply = asRecord(res)
      if (reply?.success !== true) {
        const detail = reply && typeof reply.error === "string" ? reply.error : "unknown error"
        toast.error(`Could not save: ${detail}`)
        setError(detail)
        return
      }
      applyConfig(res)
      toast.success(`Saved to the ${scope} config`)
    } catch (err: unknown) {
      const message = errorMessage(err)
      toast.error(message || "Could not save configuration")
      setError(message || "Could not save configuration")
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    if (!defaults || Object.keys(defaults).length === 0) return
    setForm(formFromValues(defaults))
    toast.info("Form reset to built-in defaults — Save to apply")
  }

  const handleOpenFolder = async (target: string) => {
    const reply = asRecord(await pyApi.openFolder(target))
    if (reply?.success !== true) {
      toast.error(reply && typeof reply.error === "string" ? reply.error : "Could not open folder")
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 text-sm text-muted-foreground">Loading configuration…</div>
    )
  }

  if (!form) {
    return (
      <div className="flex-1 p-8">
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{error || "Configuration unavailable."}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <span>Preferences</span>
          </h1>
          <Badge variant="secondary" className="font-mono text-xs border border-border bg-muted/60">
            TOML Config
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Defaults applied to every capture. Command-line flags still override these values.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      {/* Capture defaults */}
      <Card className="sheet-card shadow-sm border-border/70">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Capture Defaults</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Parallelism, limits, and output shape for new captures.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Workers</span>
              <Input
                type="number"
                min={1}
                max={32}
                value={form.workers}
                onChange={(e) => update("workers", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">Parallel fetches (1–32).</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Timeout (seconds)</span>
              <Input
                type="number"
                min={1}
                step="0.5"
                value={form.timeout}
                onChange={(e) => update("timeout", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">Per-request limit before a retry.</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Max pages</span>
              <Input
                type="number"
                min={0}
                value={form.max_pages}
                onChange={(e) => update("max_pages", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">0 means unlimited.</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Retry attempts</span>
              <Input
                type="number"
                min={0}
                value={form.retry_attempts}
                onChange={(e) => update("retry_attempts", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">Retries after a failed fetch.</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Output mode</span>
              <Select
                value={form.output_mode}
                onValueChange={(value) => update("output_mode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                library writes to the app library, local to ./&lt;domain&gt;-docs/.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Minimum content (chars)</span>
              <Input
                type="number"
                min={0}
                value={form.min_content_chars}
                onChange={(e) => update("min_content_chars", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">Pages thinner than this are skipped.</span>
            </label>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">Snapshot before overwrite</span>
                <span className="text-xs text-muted-foreground">
                  Keep the previous version so it can be diffed or rolled back.
                </span>
              </div>
              <Switch
                checked={form.snapshot}
                onCheckedChange={(checked) => update("snapshot", checked)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">Render client-side SPAs</span>
                <span className="text-xs text-muted-foreground">
                  Needs the Playwright extra. Slower, but captures JavaScript-rendered docs.
                </span>
              </div>
              <Switch
                checked={form.render}
                onCheckedChange={(checked) => update("render", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scope */}
      <Card className="sheet-card shadow-sm border-border/70">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">Crawl Scope</CardTitle>
          <CardDescription className="text-xs">
            Comma-separated URL fragments. Empty scope means the entire domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">Path scope</span>
            <Input
              value={form.path_scope}
              placeholder="/docs/, /api/"
              onChange={(e) => update("path_scope", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">Exclude paths</span>
            <Input
              value={form.exclude_paths}
              placeholder="/blog/, changelog"
              onChange={(e) => update("exclude_paths", e.target.value)}
            />
          </label>
        </CardContent>
      </Card>

      {/* Files */}
      <Card className="sheet-card shadow-sm border-border/70">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" />
            <span>Config Files</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Project config wins over global. Saving creates the file when it does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex flex-col gap-2">
          {paths.length === 0 && (
            <span className="text-xs text-muted-foreground">No config paths reported.</span>
          )}
          {paths.map((entry) => (
            <div
              key={entry.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 px-3 py-2"
            >
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize text-foreground">
                    {entry.label}
                  </span>
                  {entry.exists ? (
                    <Badge variant="outline" className="gap-1 text-xs border-success/40 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      present
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      not created
                    </Badge>
                  )}
                </div>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {entry.path}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleOpenFolder(entry.path.replace(/[\\/][^\\/]+$/, ""))
                }
              >
                <FolderOpen className="h-4 w-4 mr-1.5" />
                Open
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Presets */}
      {presetNames.length > 0 && (
        <Card className="sheet-card shadow-sm border-border/70">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold">Presets</CardTitle>
            <CardDescription className="text-xs">
              Named bundles read from your config files. Edit the TOML to change them.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex flex-col gap-2">
            {presetNames.map((name) => {
              const url = presets[name]?.url
              return (
                <div key={name} className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {name}
                    </Badge>
                    {typeof url === "string" && url && (
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {url}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleResetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset to defaults
          </Button>
          <Select value={scope} onValueChange={(value) => setScope(value as Scope)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </div>
  )
}
