"use client"

import * as React from "react"
import MuiDialog from "@mui/material/Dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

type Ctx = { open: boolean; setOpen: (o: boolean) => void }
const DialogCtx = React.createContext<Ctx | null>(null)
function useDialogCtx() {
  const c = React.useContext(DialogCtx)
  if (!c) throw new Error("Dialog subcomponent must be used within <Dialog>")
  return c
}

function Dialog({
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
  const open = openProp ?? internal
  const setOpen = React.useCallback(
    (o: boolean) => {
      setInternal(o)
      onOpenChange?.(o)
    },
    [onOpenChange]
  )
  return (
    <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>
  )
}

function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen } = useDialogCtx()
  const child = React.Children.only(children) as React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void
  }>
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e)
      setOpen(true)
    },
  })
}

// Pass-through stubs to preserve the original API surface.
const DialogPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const DialogOverlay = () => null

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Radix-compat props: when supplied (typically to preventDefault), the
  // corresponding dismiss behavior is disabled to match the consumer intent.
  onInteractOutside?: (e: Event) => void
  onEscapeKeyDown?: (e: KeyboardEvent) => void
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    { className, children, onInteractOutside, onEscapeKeyDown, ...props },
    _ref
  ) => {
  const { open, setOpen } = useDialogCtx()
  return (
    <MuiDialog
      open={open}
      onClose={(_e, reason) => {
        if (reason === "backdropClick" && onInteractOutside) return
        if (reason === "escapeKeyDown" && onEscapeKeyDown) return
        setOpen(false)
      }}
      maxWidth={false}
      slotProps={{
        paper: {
          className: cn(
            "relative grid w-full max-w-lg md:max-w-md gap-4 border bg-background p-6 shadow-lg sm:rounded-lg max-h-[90svh] md:max-h-[75vh] overflow-y-auto",
            className
          ),
          ...props,
        },
      }}
    >
      {children}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </MuiDialog>
  )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)
DialogDescription.displayName = "DialogDescription"

function DialogClose({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen } = useDialogCtx()
  const child = React.Children.only(children) as React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void
  }>
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e)
      setOpen(false)
    },
  })
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
