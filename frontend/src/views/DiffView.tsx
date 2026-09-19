import React, { useState, useEffect, useMemo, useRef } from "react"
import { 
  GitCompare, 
  Plus, 
  Minus, 
  FileCode, 
  Check, 
  Layers, 
  ArrowRight, 
  Clock, 
  Network, 
  Search, 
  Globe, 
  Hash, 
  Terminal, 
  Sparkles, 
  Copy, 
  BookOpen, 
  Share2, 
  Code,
  ChevronRight,
  ExternalLink,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { pyApi } from "@/lib/bridge"
import { toast } from "sonner"
import mermaid from "mermaid"

interface DiffViewProps {
  library: any[]
  onOpenDocReader?: (domain: string) => void
}

export const DiffView: React.FC<DiffViewProps> = ({ library, onOpenDocReader }) => {
  const [activeSubTab, setActiveSubTab] = useState<"graph" | "diff">("graph")
  const [selectedDomain, setSelectedDomain] = useState<string>(library[0]?.domain || "")

  // ── Version Diff State ────────────────────────────────────────────────
  const [v1, setV1] = useState<string>("")
  const [v2, setV2] = useState<string>("")
  const [diffResult, setDiffResult] = useState<any>(null)
  const [loadingDiff, setLoadingDiff] = useState<boolean>(false)

  // ── DocGraph State ────────────────────────────────────────────────────
  const [graphData, setGraphData] = useState<any>(null)
  const [graphQuery, setGraphQuery] = useState<string>("")
  const [loadingGraph, setLoadingGraph] = useState<boolean>(false)
  const [selectedNodeType, setSelectedNodeType] = useState<string>("all")
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [copiedGraph, setCopiedGraph] = useState<boolean>(false)
  const mermaidContainerRef = useRef<HTMLDivElement>(null)

  const currentItem = library.find((item) => item.domain === selectedDomain)
  const snapshots = (currentItem?.snapshots && currentItem.snapshots.length > 0)
    ? currentItem.snapshots
    : []

  // Load DocGraph when selected domain changes or sub-tab is activated
  const loadDocGraph = async (domain: string, query: string = "") => {
    if (!domain) return
    setLoadingGraph(true)
    try {
      const res = await pyApi.getDocGraph(domain, query)
      if (res && (res.success || res.nodes || res.results)) {
        setGraphData(res)
        setSelectedNode(res.results?.[0] || res.nodes?.[0] || null)
      } else {
        setGraphData({ domain, nodes: [], edges: [], results: [], node_count: 0, edge_count: 0 })
      }
    } catch (err: any) {
      toast.error(`Error loading DocGraph: ${err.message}`)
    } finally {
      setLoadingGraph(false)
    }
  }

  useEffect(() => {
    if (selectedDomain) {
      loadDocGraph(selectedDomain, graphQuery)
    }
  }, [selectedDomain])

  // Generate Mermaid Diagram source from graph data
  const mermaidGraphCode = useMemo(() => {
    if (!graphData) return ""
    const nodes = (graphData.nodes || graphData.results || []).slice(0, 18)
    const edges = (graphData.edges || []).slice(0, 24)

    if (nodes.length === 0) return ""

    const lines: string[] = ["graph TD"]
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20)

    nodes.forEach((n: any) => {
      const nid = sanitize(n.id || n.label)
      const lbl = (n.label || n.id).replace(/["()]/g, "'").slice(0, 28)
      if (n.type === "endpoint") {
        lines.push(`  ${nid}["⚡ ${lbl}"]:::endpoint`)
      } else if (n.type === "heading") {
        lines.push(`  ${nid}["📌 ${lbl}"]:::heading`)
      } else {
        lines.push(`  ${nid}["📄 ${lbl}"]:::page`)
      }
    })

    if (edges.length > 0) {
      edges.forEach((e: any) => {
        const src = sanitize(e.source)
        const tgt = sanitize(e.target)
        const rel = e.relation || "links"
        lines.push(`  ${src} -->|${rel}| ${tgt}`)
      })
    } else {
      // Connect sequential nodes if no explicit edges
      for (let i = 0; i < nodes.length - 1; i++) {
        const src = sanitize(nodes[i].id || nodes[i].label)
        const tgt = sanitize(nodes[i+1].id || nodes[i+1].label)
        lines.push(`  ${src} -.->|contains| ${tgt}`)
      }
    }

    lines.push("  classDef endpoint fill:#f59e0b20,stroke:#f59e0b,stroke-width:2px,color:#f59e0b;")
    lines.push("  classDef heading fill:#0ea5e920,stroke:#0ea5e9,stroke-width:1px,color:#0ea5e9;")
    lines.push("  classDef page fill:#10b98120,stroke:#10b981,stroke-width:1.5px,color:#10b981;")

    return lines.join("\n")
  }, [graphData])

  // Render Mermaid Diagram
  useEffect(() => {
    if (!mermaidContainerRef.current || !mermaidGraphCode || activeSubTab !== "graph") return

    let cancelled = false
    void (async () => {
      try {
        const id = `docgraph-svg-${Date.now()}`
        const { svg } = await mermaid.render(id, mermaidGraphCode)
        if (!cancelled && mermaidContainerRef.current) {
          mermaidContainerRef.current.innerHTML = svg
        }
      } catch {
        // Fallback gracefully
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mermaidGraphCode, activeSubTab])

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!graphData) return []
    const items = graphData.results || graphData.nodes || []
    return items.filter((n: any) => {
      if (selectedNodeType !== "all" && n.type !== selectedNodeType) return false
      if (graphQuery.trim()) {
        const q = graphQuery.toLowerCase()
        return (n.label || "").toLowerCase().includes(q) ||
               (n.snippet || "").toLowerCase().includes(q) ||
               (n.file || "").toLowerCase().includes(q)
      }
      return true
    })
  }, [graphData, selectedNodeType, graphQuery])

  const handleCompare = async () => {
    if (!selectedDomain || !v1 || !v2) {
      toast.error("Please select a domain and two snapshot versions to compare")
      return
    }

    setLoadingDiff(true)
    try {
      const res = await pyApi.diffSnapshots(selectedDomain, v1, v2)
      if (res.success) {
        setDiffResult(res)
        toast.success(`Computed diff for ${selectedDomain}`)
      } else {
        toast.error(`Diff failed: ${res.error}`)
      }
    } catch (err: any) {
      toast.error(`Diff error: ${err.message}`)
    } finally {
      setLoadingDiff(false)
    }
  }

  const getNodeTypeBadge = (type: string) => {
    switch (type) {
      case "endpoint":
        return "border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400"
      case "heading":
        return "border-cyan-500/40 text-cyan-600 bg-cyan-500/10 dark:text-cyan-400"
      case "code_symbol":
        return "border-purple-500/40 text-purple-600 bg-purple-500/10 dark:text-purple-400"
      default:
        return "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Banner with Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              <span>DocGraph &amp; Version Explorer</span>
            </h1>
            <Badge variant="secondary" className="font-mono text-xs border border-border bg-muted/60">
              AST Semantic Model &amp; Snapshots
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Explore non-linear semantic entity graphs, symbol hierarchies, and audit snapshot revisions across captured docsets.
          </p>
        </div>

        <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)} className="w-auto">
          <TabsList className="grid grid-cols-2 w-[280px] bg-muted/60">
            <TabsTrigger value="graph" className="text-xs gap-1.5 font-medium">
              <Share2 className="h-3.5 w-3.5" />
              <span>Concept Graph</span>
            </TabsTrigger>
            <TabsTrigger value="diff" className="text-xs gap-1.5 font-medium">
              <GitCompare className="h-3.5 w-3.5" />
              <span>Version Diff</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Domain Selection Bar */}
      <Card className="glass-card shadow-sm border-border/70">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 font-mono">
              Target Docset:
            </span>
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value)
                setV1("")
                setV2("")
                setDiffResult(null)
              }}
              className="h-9 w-full sm:w-72 rounded-lg border border-border bg-background/80 px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono font-medium"
            >
              {library.map((item) => (
                <option key={item.domain} value={item.domain}>
                  {item.domain} ({item.pages || item.pages_count || 0} pages · {item.snapshot_count || item.snapshots?.length || 1} v)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>Provider: <strong className="text-primary capitalize">{currentItem?.provider || "generic"}</strong></span>
            <span>•</span>
            <span>Total Pages: <strong className="text-foreground">{currentItem?.pages || currentItem?.pages_count || 0}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* TAB 1: CONCEPT GRAPH EXPLORER (DocGraph) */}
      {activeSubTab === "graph" && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Search & Type Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search concepts, endpoints (GET/POST), symbols, or headings..."
                value={graphQuery}
                onChange={(e) => setGraphQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDocGraph(selectedDomain, graphQuery)}
                className="pl-9 h-9 text-xs bg-background/80 font-mono focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-background/80 border border-border p-1 rounded-lg">
              <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              <button
                onClick={() => setSelectedNodeType("all")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedNodeType === "all" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({graphData?.node_count || graphData?.results?.length || 0})
              </button>
              <button
                onClick={() => setSelectedNodeType("endpoint")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedNodeType === "endpoint" ? "bg-amber-500 text-white font-semibold" : "text-muted-foreground hover:text-amber-500"
                }`}
              >
                Endpoints
              </button>
              <button
                onClick={() => setSelectedNodeType("page")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedNodeType === "page" ? "bg-emerald-600 text-white font-semibold" : "text-muted-foreground hover:text-emerald-500"
                }`}
              >
                Pages
              </button>
              <button
                onClick={() => setSelectedNodeType("heading")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedNodeType === "heading" ? "bg-cyan-600 text-white font-semibold" : "text-muted-foreground hover:text-cyan-500"
                }`}
              >
                Headings
              </button>
            </div>
          </div>

          {/* Visual Architecture Diagram */}
          {mermaidGraphCode && (
            <Card className="glass-card shadow-sm overflow-hidden border-border/70">
              <CardHeader className="p-4 pb-2 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Concept Relationship Topology (AST Subgraph)
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  Interactive Node Map
                </Badge>
              </CardHeader>
              <CardContent className="p-6 overflow-x-auto flex items-center justify-center bg-background/50 min-h-[160px]">
                <div ref={mermaidContainerRef} className="w-full flex items-center justify-center font-mono text-xs" />
              </CardContent>
            </Card>
          )}

          {/* Grid: Concept Entities & Detail Preview Drawer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entity List (Left 2 cols) */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
                <span>Discovered Concept Nodes ({filteredNodes.length})</span>
                <span>Click node to inspect connected context</span>
              </div>

              {loadingGraph ? (
                <div className="flex h-48 items-center justify-center text-xs text-muted-foreground font-mono">
                  Synthesizing AST Concept Graph...
                </div>
              ) : filteredNodes.length === 0 ? (
                <Card className="glass-card p-8 text-center border-dashed border-border/80">
                  <p className="text-xs text-muted-foreground font-mono">
                    No concept nodes match the filter. Capture a docset or clear your query to view the full graph.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredNodes.map((node: any) => {
                    const isSelected = selectedNode?.id === node.id
                    return (
                      <Card
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`cursor-pointer p-3.5 transition-all glass-card hover:border-primary/50 interactive-scale ${
                          isSelected ? "border-primary bg-primary/10 shadow-sm shadow-primary/20" : "border-border/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`text-[9px] uppercase font-mono tracking-wider h-4 px-1.5 py-0 ${getNodeTypeBadge(node.type)}`}>
                            {node.type || "concept"}
                          </Badge>
                          {node.file && (
                            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                              {node.file}
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-xs text-foreground truncate font-mono mb-1" title={node.label}>
                          {node.label || node.id}
                        </h4>

                        {node.snippet && (
                          <p className="text-[11px] text-muted-foreground font-sans line-clamp-2 leading-relaxed">
                            {node.snippet}
                          </p>
                        )}

                        {node.connected_entities && node.connected_entities.length > 0 && (
                          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                            <Share2 className="h-3 w-3 text-primary shrink-0" />
                            <span>{node.connected_entities.length} connected context link{node.connected_entities.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Selected Node Detail Inspector (Right 1 col) */}
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground font-mono px-1">
                Node Inspector
              </div>

              {selectedNode ? (
                <Card className="glass-card p-4 space-y-3.5 border-border/80 sticky top-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={`text-[9px] uppercase font-mono ${getNodeTypeBadge(selectedNode.type)}`}>
                      {selectedNode.type || "concept"}
                    </Badge>
                    {onOpenDocReader && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDocReader(selectedDomain)}
                        className="h-7 text-xs px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Read</span>
                      </Button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground font-mono break-all">
                      {selectedNode.label || selectedNode.id}
                    </h3>
                    {selectedNode.file && (
                      <p className="text-[11px] text-muted-foreground font-mono mt-1">
                        File: <code>{selectedNode.file}</code>
                      </p>
                    )}
                  </div>

                  {selectedNode.snippet && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider font-mono">
                        Context Snippet:
                      </span>
                      <p className="text-xs text-foreground/90 font-mono bg-muted/40 p-2.5 rounded-lg border border-border/40 leading-relaxed select-text">
                        {selectedNode.snippet}
                      </p>
                    </div>
                  )}

                  {selectedNode.connected_entities && selectedNode.connected_entities.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider font-mono">
                        Related Graph Entities:
                      </span>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedNode.connected_entities.map((conn: any, i: number) => (
                          <div
                            key={i}
                            className="p-2 rounded-md bg-background/80 border border-border/60 text-[11px] flex items-center justify-between"
                          >
                            <span className="font-mono font-medium truncate max-w-[140px] text-foreground">
                              {conn.label || conn.id}
                            </span>
                            <Badge variant="secondary" className="text-[9px] font-mono py-0 h-4">
                              {conn.relation || "links"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="glass-card p-6 text-center text-xs text-muted-foreground font-mono border-dashed">
                  Select an entity node to inspect AST links and snippet context.
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERSION HISTORY & DIFF VIEWER */}
      {activeSubTab === "diff" && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Selector Bar */}
          <Card className="glass-card shadow-sm border-border/70">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Base Snapshot (Older)</label>
                  <select
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background/80 px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  >
                    <option value="">Select Base Snapshot</option>
                    {snapshots.map((s: any) => {
                      const val = typeof s === "string" ? s : (s.version || s.version_id || "?")
                      return (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Target Snapshot (Newer)</label>
                  <select
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background/80 px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  >
                    <option value="">Select Target Snapshot</option>
                    {snapshots.map((s: any) => {
                      const val = typeof s === "string" ? s : (s.version || s.version_id || "?")
                      return (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <Button
                  onClick={handleCompare}
                  disabled={loadingDiff || !v1 || !v2}
                  className="h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 interactive-scale"
                >
                  {loadingDiff ? "Diffing..." : "Compare Snapshots"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Diff Result Content */}
          {diffResult && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">File Modifications</h3>
                  <Badge variant="outline" className="font-mono text-xs border-border bg-muted/50">
                    {diffResult.changes?.length || 0} change sets
                  </Badge>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-700 dark:text-emerald-500 font-semibold">+{diffResult.lines_added || 0} added</span>
                  <span className="text-destructive font-semibold">-{diffResult.lines_removed || 0} removed</span>
                </div>
              </div>

              <div className="space-y-3">
                {diffResult.changes?.map((c: any, idx: number) => (
                  <Card key={idx} className="glass-card overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2.5">
                      <div className="flex items-center gap-2 font-mono text-xs text-foreground font-semibold">
                        <FileCode className="h-4 w-4 text-primary" />
                        <span>{c.url || c.file || "docs.md"}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-emerald-700 dark:text-emerald-500 font-semibold">+{c.lines_added || 0}</span>
                        <span className="text-destructive font-semibold">-{c.lines_removed || 0}</span>
                      </div>
                    </div>

                    <div className="p-4 font-mono text-xs bg-background/70 overflow-x-auto select-text leading-relaxed">
                      {c.diff_text ? (
                        <div className="flex flex-col gap-0.5">
                          {c.diff_text.split("\n").map((line: string, lIdx: number) => {
                            const isAdd = line.startsWith("+") && !line.startsWith("+++")
                            const isDel = line.startsWith("-") && !line.startsWith("---")
                            const isHdr = line.startsWith("@@")
                            return (
                              <div
                                key={lIdx}
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  isAdd ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                                  isDel ? "bg-destructive/15 text-destructive" :
                                  isHdr ? "text-primary/80 font-bold bg-primary/5" :
                                  "text-muted-foreground"
                                }`}
                              >
                                {line}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">No textual differences found between snapshots.</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!diffResult && snapshots.length <= 1 && (
            <Card className="glass-card p-8 text-center border-dashed border-border/80">
              <Clock className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-foreground">Single Snapshot Available</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                This docset currently has 1 snapshot ({snapshots[0] || "v1.0.0"}). Re-capturing documentation after updates will record semver snapshots for comparison.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
