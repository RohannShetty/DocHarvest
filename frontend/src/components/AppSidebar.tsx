import React from "react"
import { APP_VERSION } from "@/lib/version"
import { 
  Download, 
  Library, 
  Search, 
  GitCompare, 
  FileUp, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Sun, 
  Moon,
  Command,
  Heart,
  BookOpen,
  HelpCircle,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type TabId = "capture" | "library" | "search" | "diff" | "export" | "docs" | "diagnostics" | "settings"

interface AppSidebarProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  theme: "dark" | "light"
  onToggleTheme: () => void
  libraryCount?: number
  onOpenAbout?: () => void
  onOpenTour?: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  theme,
  onToggleTheme,
  onOpenAbout,
  onOpenTour
}) => {
  const navItems = [
    { id: "capture" as TabId, label: "Capture Studio", icon: Download, badge: null },
    { id: "library" as TabId, label: "Document Library", icon: Library, badge: null },
    { id: "search" as TabId, label: "Search Studio", icon: Search, badge: null },
    { id: "diff" as TabId, label: "DocGraph & Diff", icon: GitCompare, badge: "Graph" },
    { id: "export" as TabId, label: "Export Studio", icon: FileUp, badge: "RAG" },
    { id: "docs" as TabId, label: "Documentation", icon: BookOpen, badge: null },
    { id: "diagnostics" as TabId, label: "Diagnostics", icon: Activity, badge: null },
    { id: "settings" as TabId, label: "Preferences", icon: Settings, badge: null },
  ]

  return (
    <aside
      aria-expanded={!isCollapsed}
      className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 select-none ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-3.5">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center border border-border bg-muted/20 text-primary">
              <Layers className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-foreground text-sm font-sans">DocHarvest</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/10 font-mono">
                  v{APP_VERSION}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-normal truncate">Universal Doc Harvester</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 mx-auto items-center justify-center border border-border bg-muted/20 text-primary">
            <Layers className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-0.5 p-1.5" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-accent/40 text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-primary"
                  : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
              }`}
            >
              <Icon
                strokeWidth={1.5}
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <div className="flex flex-1 items-center justify-between overflow-hidden">
                <span className={isCollapsed ? "sr-only" : "truncate"}>{item.label}</span>
                {!isCollapsed && item.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-xs h-4 px-1.5 font-normal"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer Controls */}
      <div className="border-t border-border p-2 space-y-2">
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-1.5" : "justify-between"}`}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
            </Button>

            {onOpenTour && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTour}
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-primary"
                title="Start Interactive Tour"
                aria-label="Start Interactive Tour"
              >
                <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            )}

            {onOpenAbout && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenAbout}
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-primary"
                title="About DocHarvest & Author"
                aria-label="About DocHarvest & Author"
              >
                <Heart className="h-3.5 w-3.5 text-destructive hover:text-destructive" strokeWidth={1.5} />
              </Button>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 border border-border bg-muted text-xs font-mono flex items-center gap-0.5">
                <Command className="h-2.5 w-2.5" strokeWidth={1.5} /> K
              </kbd>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" strokeWidth={1.5} /> : <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
