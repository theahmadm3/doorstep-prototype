
import * as React from "react"
import MuiPopover from "@mui/material/Popover"

import { cn } from "@/lib/utils"

type Ctx = {
  open: boolean
  setOpen: (o: boolean) => void
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
}
const PopoverCtx = React.createContext<Ctx | null>(null)
function usePopoverCtx() {
  const c = React.useContext(PopoverCtx)
  if (!c) throw new Error("Popover subcomponent must be used within <Popover>")
  return c
}

function Popover({
  open: openProp,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (o: boolean) => void
  children: React.ReactNode
  [key: string]: unknown
}) {
  const [internal, setInternal] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const open = openProp ?? internal
  const setOpen = React.useCallback(
    (o: boolean) => {
      setInternal(o)
      onOpenChange?.(o)
    },
    [onOpenChange]
  )
  return (
    <PopoverCtx.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </PopoverCtx.Provider>
  )
}

function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen, setAnchorEl } = usePopoverCtx()
  const child = React.Children.only(children) as React.ReactElement<{
    onClick?: (e: React.MouseEvent<HTMLElement>) => void
  }>
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      child.props.onClick?.(e)
      setAnchorEl(e.currentTarget)
      setOpen(true)
    },
  })
}

// Pass-through to preserve API parity with Radix's PopoverAnchor.
const PopoverAnchor = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, _ref) => {
    const { open, setOpen, anchorEl } = usePopoverCtx()
    const horizontal =
      align === "start" ? "left" : align === "end" ? "right" : "center"
    return (
      <MuiPopover
        open={open && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal }}
        transformOrigin={{ vertical: "top", horizontal }}
        marginThreshold={sideOffset}
        slotProps={{
          paper: {
            className: cn(
              "w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
              className
            ),
            ...props,
          },
        }}
      >
        {children}
      </MuiPopover>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
