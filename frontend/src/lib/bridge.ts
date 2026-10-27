/**
 * Python PyWebView API client with fallbacks for standalone dev.
 */

export interface CaptureProgressPayload {
  kind: "discovered" | "downloaded" | "failed" | "info" | "written"
  url?: string
  title?: string
  size_kb?: number
  message?: string
  count?: number
  done: number
  downloaded: number
  failed: number
  discovered: number
  total: number
  percent: number
  elapsed: number
}

export interface CaptureDonePayload {
  success: boolean
  error?: string
  cancelled?: boolean
  pages_downloaded?: number
  result?: any
  stats?: {
    discovered: number
    downloaded: number
    failed: number
  }
}

declare global {
  interface Window {
    pywebview?: {
      api: {
        detect: (url: string) => Promise<any>
        start_capture: (url: string, options: any) => Promise<any>
        cancel_capture: () => Promise<any>
        reset_capture: () => Promise<any>
        list_library: () => Promise<any[]>
        get_library_doc: (domain: string) => Promise<any>
        delete_domain: (domain: string) => Promise<any>
        rename_domain: (oldDomain: string, newDomain: string) => Promise<any>
        open_folder: (path: string) => Promise<any>
        open_file: (path: string) => Promise<any>
        read_file: (filePath: string) => Promise<any>
        search_docs: (query: string, domain?: string) => Promise<any[]>
        list_snapshots: (domain: string) => Promise<any[]>
        diff_snapshots: (domain: string, v1: string, v2: string) => Promise<any>
        get_doc_graph: (domain: string, query?: string) => Promise<any>
        get_diagnostics: () => Promise<any>
        get_system_info: () => Promise<any>
        get_lock_status: (domain?: string) => Promise<any>
        is_render_available: () => Promise<any>
        export_doc: (domain: string, format: string, customPath?: string) => Promise<any>
        get_config: () => Promise<any>
        save_config: (values: Record<string, any>, scope?: string) => Promise<any>
      }
    }
    onCaptureProgress?: (data: CaptureProgressPayload) => void
    onCaptureDone?: (data: CaptureDonePayload) => void
  }
}


// In browser dev mode (e.g. Vite dev server), initialize a lightweight proxy shim
// connecting window.pywebview.api to the Python backend over /api and SSE /api/events.
if (typeof window !== "undefined" && !window.pywebview) {
  window.pywebview = {
    api: new Proxy({} as any, {
      get: (_target, prop) => {
        return async (...args: any[]) => {
          const resp = await fetch("/api/" + String(prop), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          })
          if (!resp.ok) {
            throw new Error(`API request failed with status ${resp.status}`)
          }
          return await resp.json()
        }
      },
    }),
  }

  try {
    const evt = new EventSource("/api/events")
    evt.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload && payload.func && typeof (window as any)[payload.func] === "function") {
          ;(window as any)[payload.func](payload.data)
        }
      } catch (err) {
        console.warn("Failed to dispatch event", err)
      }
    }
  } catch (err) {
    console.warn("SSE connection failed", err)
  }
}

export const pyApi = {
  detect: async (url: string) => {
    if (window.pywebview?.api?.detect) return await window.pywebview.api.detect(url)
    return { success: true, detected: true, provider: 'generic', site_versions: [] }
  },
  startCapture: async (url: string, options: any) => {
    if (window.pywebview?.api?.start_capture) return await window.pywebview.api.start_capture(url, options)
    return { success: true, message: 'Simulated capture start' }
  },
  cancelCapture: async () => {
    if (window.pywebview?.api?.cancel_capture) return await window.pywebview.api.cancel_capture()
    return { success: true }
  },
  resetCapture: async () => {
    if (window.pywebview?.api?.reset_capture) return await window.pywebview.api.reset_capture()
    return { success: true, cleared_locks: 0 }
  },
  getLockStatus: async (domain?: string) => {
    if (window.pywebview?.api?.get_lock_status) return await window.pywebview.api.get_lock_status(domain)
    return { success: true, active_locks: [], has_active_locks: false, domain_locked: false }
  },
  listLibrary: async () => {
    if (window.pywebview?.api?.list_library) return await window.pywebview.api.list_library()
    return []
  },
  getLibraryDoc: async (domain: string) => {
    if (window.pywebview?.api?.get_library_doc) return await window.pywebview.api.get_library_doc(domain)
    return {
      success: true,
      domain,
      title: `${domain} Documentation`,
      content: `# ${domain} Documentation\n\nNo document content loaded.`,
      pages: []
    }
  },
  readFile: async (filePath: string) => {
    if (window.pywebview?.api?.read_file) return await window.pywebview.api.read_file(filePath)
    return { success: true, content: `# Page ${filePath}\n\nContent of ${filePath}`, filename: filePath }
  },
  deleteDomain: async (domain: string) => {
    if (window.pywebview?.api?.delete_domain) return await window.pywebview.api.delete_domain(domain)
    return { success: true }
  },
  renameDomain: async (oldDomain: string, newDomain: string) => {
    if (window.pywebview?.api?.rename_domain) return await window.pywebview.api.rename_domain(oldDomain, newDomain)
    return { success: true, domain: newDomain }
  },
  openFolder: async (path: string) => {
    if (window.pywebview?.api?.open_folder) return await window.pywebview.api.open_folder(path)
    return { success: true }
  },
  openFile: async (path: string) => {
    if (window.pywebview?.api?.open_file) return await window.pywebview.api.open_file(path)
    return { success: true }
  },
  searchDocs: async (query: string, domain?: string) => {
    if (window.pywebview?.api?.search_docs) return await window.pywebview.api.search_docs(query, domain)
    return []
  },
  listSnapshots: async (domain: string) => {
    if (window.pywebview?.api?.list_snapshots) return await window.pywebview.api.list_snapshots(domain)
    return []
  },
  diffSnapshots: async (domain: string, v1: string, v2: string) => {
    if (window.pywebview?.api?.diff_snapshots) return await window.pywebview.api.diff_snapshots(domain, v1, v2)
    return { success: true, changes: [] }
  },
  getDocGraph: async (domain: string, query?: string) => {
    if (window.pywebview?.api?.get_doc_graph) return await window.pywebview.api.get_doc_graph(domain, query)
    return { success: true, domain, node_count: 0, edge_count: 0, nodes: [], edges: [], results: [] }
  },
  getDiagnostics: async () => {
    if (window.pywebview?.api?.get_diagnostics) return await window.pywebview.api.get_diagnostics()
    return {}
  },
  getSystemInfo: async () => {
    if (window.pywebview?.api?.get_system_info) return await window.pywebview.api.get_system_info()
    return {
      name: 'DocHarvest',
      version: '11.3.2',
      engine: 'DocHarvest Engine v11.3.2 (AST + FastMCP v2 + fpdf2)',
      platform: 'win32',
      library_dir: '~/.docharvest/docs'
    }
  },
  isRenderAvailable: async () => {
    if (window.pywebview?.api?.is_render_available) return await window.pywebview.api.is_render_available()
    return { available: false }
  },
  exportDoc: async (domain: string, format: string, customPath?: string) => {
    if (window.pywebview?.api?.export_doc) return await window.pywebview.api.export_doc(domain, format, customPath)
    return { success: true, path: `exports/${domain}-docs.${format}`, format }
  },
  getConfig: async () => {
    if (window.pywebview?.api?.get_config) return await window.pywebview.api.get_config()
    return {
      success: true,
      values: { workers: 5, timeout: 20, max_pages: 0, snapshot: true, render: false, output_mode: "both" },
      defaults: {},
      presets: {},
      sources: [],
      paths: []
    }
  },
  saveConfig: async (values: Record<string, any>, scope: string = "global") => {
    if (window.pywebview?.api?.save_config) return await window.pywebview.api.save_config(values, scope)
    return { success: true, path: "(browser preview)", values }
  }
}
