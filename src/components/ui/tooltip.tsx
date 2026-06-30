"use client"

import * as React from "react"
import MuiTooltip from "@mui/material/Tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = ({
  children,
}: {
  children?: React.ReactNode
  delayDuration?: number
  [key: string]: unknown
}) => <>{children}</>

interface TooltipTriggerProps {
  asChild?: boolean
  children: React.ReactElement
}
function TooltipTrigger({ children }: TooltipTriggerProps) {
  return children
}
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  hidden?: boolean
}
const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, ...props }, _ref) => (
    <div
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
TooltipContent.displayName = "TooltipContent"

function Tooltip({ children }: { children: React.ReactNode }) {
  let triggerNode: React.ReactElement | null = null
  let contentNode: React.ReactNode = null
  let hidden = false
  let placement: "top" | "right" | "bottom" | "left" = "top"

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === TooltipContent) {
      const props = child.props as TooltipContentProps
      contentNode = child
      if (props.hidden) hidden = true
      if (props.side) placement = props.side
    } else if (child.type === TooltipTrigger) {
      const props = child.props as TooltipTriggerProps
      triggerNode = React.Children.only(
        props.children
      ) as React.ReactElement
    } else {
      triggerNode = child
    }
  })

  if (!triggerNode) return null
  if (hidden || contentNode == null) return triggerNode

  return (
    <MuiTooltip
      title={contentNode}
      placement={placement}
      slotProps={{ tooltip: { className: "bg-transparent p-0 m-0 max-w-none" } }}
    >
      {triggerNode}
    </MuiTooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
