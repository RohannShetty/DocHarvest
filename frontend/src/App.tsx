import React, { useState, useEffect } from "react"
import { AppSidebar, TabId } from "@/components/AppSidebar"
import { CommandMenu } from "@/components/CommandMenu"
import { DocReaderModal } from "@/components/DocReaderModal"
import { AboutModal } from "@/components/AboutModal"
import { CaptureStudio } from "@/views/CaptureStudio"
import { LibraryView } from "@/views/LibraryView"
import { SearchView } from "@/views/SearchView"
import { DiffView } from "@/views/DiffView"
import { ExportView } from "@/views/ExportView"
import { DiagnosticsView } from "@/views/DiagnosticsView"
import { InAppDocsView } from "@/views/InAppDocsView"
import { OnboardingTour } from "@/components/OnboardingTour"
import { Toaster } from "@/components/ui/sonner"
import { pyApi } from "@/lib/bridge"

const THEME_STORAGE_KEY = "docharvest_theme"

// Read the persisted theme; fall back to dark when absent, invalid, or when
// localStorage itself throws (restricted webviews).
function readStoredTheme(): "dark" | "light" {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark"
  } catch {
    return "dark"
  }
}

// Persist the theme; non-fatal when storage is unavailable.
function persistTheme(theme: "dark" | "light"): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Theme preference simply won't survive a restart.
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("capture")
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [theme, setTheme] = useState<"dark" | "light">(() => readStoredTheme())
  const [cmdMenuOpen, setCmdMenuOpen] = useState<boolean>(false)
  const [aboutOpen, setAboutOpen] = useState<boolean>(false)
  const [tourOpen, setTourOpen] = useState<boolean>(false)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  
  // Library State
  const [library, setLibrary] = useState<any[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(false)
  
  // Modal State
  const [readerDomain, setReaderDomain] = useState<string | null>(null)
  const [exportDomain, setExportDomain] = useState<string | undefined>(undefined)

  const loadLibrary = async () => {
    setLoadingLibrary(true)
    try {
      const items = await pyApi.listLibrary()
      setLibrary(items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingLibrary(false)
    }
  }

  // Fetch system info and library on mount
  useEffect(() => {
    pyApi.getSystemInfo().then(setSystemInfo).catch(console.error)
    loadLibrary()
    
    // Check if first-time user tour should be shown
    try {
      const tourCompleted = localStorage.getItem("docharvest_tour_completed")
      if (!tourCompleted) {
        setTourOpen(true)
      }
    } catch {
      // Storage unavailable or restricted in webview
    }
  }, [])

  // Reload library whenever the active tab changes to keep UI synchronized
  useEffect(() => {
    loadLibrary()
  }, [activeTab])

  // Keep the documentElement class in sync with the theme state. This also
  // covers the initial mount, correcting index.html's "dark" default when a
  // light theme was persisted.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
  }, [theme])

  // Theme switcher
  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    persistTheme(next)
  }

  // Global Keyboard Navigation Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable

      // Universal Command Palette (Ctrl+K / Cmd+K)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCmdMenuOpen((open) => !open)
        return
      }

      // Toggle Theme (Ctrl+T / Cmd+T)
      if (e.key === "t" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleToggleTheme()
        return
      }

      // Refresh Library (Ctrl+R / Cmd+R when not prevented, or custom)
      if (e.key === "r" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        loadLibrary()
        return
      }

      // Number-based tab switching (1-7 without Ctrl when not focused on input, or Ctrl+1..7 always)
      if (!isInput && !e.altKey && !e.metaKey && !e.ctrlKey) {
        if (e.key === "1") { setActiveTab("capture"); return }
        if (e.key === "2") { setActiveTab("library"); return }
        if (e.key === "3") { setActiveTab("search"); return }
        if (e.key === "4") { setActiveTab("diff"); return }
        if (e.key === "5") { setActiveTab("export"); return }
        if (e.key === "6") { setActiveTab("docs"); return }
        if (e.key === "7") { setActiveTab("diagnostics"); return }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === "1") { e.preventDefault(); setActiveTab("capture"); return }
        if (e.key === "2") { e.preventDefault(); setActiveTab("library"); return }
        if (e.key === "3") { e.preventDefault(); setActiveTab("search"); return }
        if (e.key === "4") { e.preventDefault(); setActiveTab("diff"); return }
        if (e.key === "5") { e.preventDefault(); setActiveTab("export"); return }
        if (e.key === "6") { e.preventDefault(); setActiveTab("docs"); return }
        if (e.key === "7") { e.preventDefault(); setActiveTab("diagnostics"); return }
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [theme])

  const handleSelectExport = (domain: string) => {
    setExportDomain(domain)
    setActiveTab("export")
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      {/* Collapsible Modern Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        libraryCount={library.length}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenTour={() => setTourOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-background/50">
        {activeTab === "capture" && (
          <CaptureStudio
            onCaptureCompleted={loadLibrary}
            onOpenDocReader={setReaderDomain}
          />
        )}
        {activeTab === "library" && (
          <LibraryView
            library={library}
            loading={loadingLibrary}
            onRefresh={loadLibrary}
            onOpenDocReader={setReaderDomain}
            onSelectExport={handleSelectExport}
          />
        )}
        {activeTab === "search" && (
          <SearchView
            library={library}
            onOpenDocReader={setReaderDomain}
          />
        )}
        {activeTab === "diff" && (
          <DiffView library={library} onOpenDocReader={setReaderDomain} />
        )}
        {activeTab === "export" && (
          <ExportView library={library} selectedDomain={exportDomain} />
        )}
        {activeTab === "docs" && (
          <InAppDocsView />
        )}
        {activeTab === "diagnostics" && (
          <DiagnosticsView />
        )}
      </main>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandMenu
        open={cmdMenuOpen}
        onOpenChange={setCmdMenuOpen}
        onSelectTab={setActiveTab}
        libraryItems={library}
        onOpenDocReader={setReaderDomain}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* Split-View Markdown Reader Modal */}
      <DocReaderModal
        domain={readerDomain}
        theme={theme}
        onClose={() => setReaderDomain(null)}
      />

      {/* About DocHarvest & Author Modal */}
      <AboutModal
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        systemInfo={systemInfo}
      />

      {/* First-Time User Onboarding Tour */}
      <OnboardingTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
      />

      {/* Toast Notification Container */}
      <Toaster theme={theme} />
    </div>
  )
}
export default App
