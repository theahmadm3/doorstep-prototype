import * as React from "react"

// Minimal type stubs kept so use-toast.ts type imports still resolve.
// The Radix Toast primitives have been removed; rendering is now done via MUI Snackbar in toaster.tsx.

export type ToastProps = {
  variant?: "default" | "destructive"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export type ToastActionElement = React.ReactElement
