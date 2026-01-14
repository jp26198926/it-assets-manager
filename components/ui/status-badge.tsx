import type React from "react"
import { cn } from "@/lib/utils"

type StatusVariant = "default" | "success" | "warning" | "destructive" | "info" | "secondary"

interface StatusBadgeProps {
  variant?: StatusVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/20 text-success border-success/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  destructive: "bg-destructive/20 text-destructive border-destructive/30",
  info: "bg-info/20 text-info border-info/30",
  secondary: "bg-secondary text-muted-foreground",
}

export function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
