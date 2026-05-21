"use client"

import * as React from "react"
import MuiDialog from "@mui/material/Dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Ctx = { open: boolean; setOpen: (o: boolean) => void }
const AlertDialogCtx = React.createContext<Ctx | null>(null)
function useAlertDialogCtx() {
  const c = React.useContext(AlertDialogCtx)
  if (!c)
    throw new Error(
      "AlertDialog subcomponent must be used within <AlertDialog>"
    )
  return c
}

function AlertDialog({
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
    <AlertDialogCtx.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogCtx.Provider>
  )
}

function AlertDialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen } = useAlertDialogCtx()
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

const AlertDialogPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const AlertDialogOverlay = () => null

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, _ref) => {
  const { open, setOpen } = useAlertDialogCtx()
  return (
    <MuiDialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth={false}
      slotProps={{
        paper: {
          className: cn(
            "grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            className
          ),
          ...props,
        },
      }}
    >
      {children}
    </MuiDialog>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
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
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold", className)} {...props} />
)
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useAlertDialogCtx()
  return (
    <Button
      ref={ref}
      className={className}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    />
  )
})
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useAlertDialogCtx()
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn("mt-2 sm:mt-0", className)}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    />
  )
})
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
