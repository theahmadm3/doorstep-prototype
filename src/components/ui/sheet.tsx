
import * as React from "react"
import Drawer from "@mui/material/Drawer"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

type Ctx = { open: boolean; setOpen: (o: boolean) => void }
const SheetCtx = React.createContext<Ctx | null>(null)
function useSheetCtx() {
  const c = React.useContext(SheetCtx)
  if (!c) throw new Error("Sheet subcomponent must be used within <Sheet>")
  return c
}

function Sheet({
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
    <SheetCtx.Provider value={{ open, setOpen }}>{children}</SheetCtx.Provider>
  )
}

function SheetTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen } = useSheetCtx()
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

function SheetClose({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement
}) {
  const { setOpen } = useSheetCtx()
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

const SheetPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const SheetOverlay = () => null

const sheetVariants = cva("gap-4 bg-background p-6 shadow-lg", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "h-full w-3/4 border-r sm:max-w-sm",
      right: "h-full w-3/4 border-l sm:max-w-sm",
    },
  },
  defaultVariants: {
    side: "right",
  },
})

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, _ref) => {
    const { open, setOpen } = useSheetCtx()
    return (
      <Drawer
        anchor={side ?? "right"}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            className: cn(sheetVariants({ side }), className),
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
      </Drawer>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter"

const SheetTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
)
SheetTitle.displayName = "SheetTitle"

const SheetDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
