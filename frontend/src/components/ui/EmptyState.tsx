import React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "border border-border bg-card font-sans",
        className
      )}
    >
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center border border-border bg-muted/20 text-muted-foreground mb-4">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-sm font-semibold tracking-tight text-foreground font-sans">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground font-sans leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
      {children}
    </div>
  )
}
