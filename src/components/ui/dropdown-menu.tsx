
import * as React from "react"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Divider from "@mui/material/Divider"
import { Check, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

type DropdownMenuContextValue = {
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
  open: boolean
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  anchorEl: null,
  setAnchorEl: () => {},
  open: false,
})

interface DropdownMenuProps {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenu = ({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: DropdownMenuProps) => {
  const [anchorEl, setAnchorElState] = React.useState<HTMLElement | null>(null)
  const isControlled = open !== undefined

  // When controlled but no anchor captured yet, we still need a render target.
  const effectiveOpen = isControlled ? open : Boolean(anchorEl)

  const setAnchorEl = React.useCallback(
    (el: HTMLElement | null) => {
      setAnchorElState(el)
      onOpenChange?.(Boolean(el))
    },
    [onOpenChange]
  )

  React.useEffect(() => {
    if (defaultOpen) {
      // no-op: uncontrolled open requires an anchor; defaultOpen rarely used.
    }
  }, [defaultOpen])

  return (
    <DropdownMenuContext.Provider
      value={{ anchorEl, setAnchorEl, open: effectiveOpen }}
    >
      {children}
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLElement,
  DropdownMenuTriggerProps
>(({ asChild, children, onClick, ...props }, ref) => {
  const { setAnchorEl } = React.useContext(DropdownMenuContext)

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>
    return React.cloneElement(child, {
      ref,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e)
        setAnchorEl(e.currentTarget)
      },
    })
  }

  return (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={(e) => {
        onClick?.(e)
        setAnchorEl(e.currentTarget)
      }}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps {
  className?: string
  children?: React.ReactNode
  align?: "start" | "center" | "end"
  sideOffset?: number
  forceMount?: boolean
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, align = "start", ...props }, _ref) => {
    const { anchorEl, open, setAnchorEl } = React.useContext(DropdownMenuContext)
    const horizontal = align === "end" ? "right" : align === "center" ? "center" : "left"
    return (
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal }}
        transformOrigin={{ vertical: "top", horizontal }}
        slotProps={{ paper: { className: cn("min-w-[8rem]", className) } }}
        {...props}
      >
        {children}
      </Menu>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

interface DropdownMenuItemProps
  extends Omit<React.HTMLAttributes<HTMLLIElement>, "onSelect"> {
  inset?: boolean
  disabled?: boolean
  onSelect?: (event: Event) => void
}

const DropdownMenuItem = React.forwardRef<HTMLLIElement, DropdownMenuItemProps>(
  ({ className, inset, disabled, onClick, onSelect, children, ...props }, ref) => {
    const { setAnchorEl } = React.useContext(DropdownMenuContext)
    return (
      <MenuItem
        ref={ref}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e)
          onSelect?.(e.nativeEvent)
          setAnchorEl(null)
        }}
        className={cn(
          "gap-2 text-sm",
          inset && "pl-8",
          className
        )}
        {...props}
      >
        {children}
      </MenuItem>
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean
}

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLLIElement,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, onClick, onSelect, ...props }, ref) => {
  const { setAnchorEl } = React.useContext(DropdownMenuContext)
  return (
    <MenuItem
      ref={ref}
      onClick={(e) => {
        onClick?.(e)
        onSelect?.(e.nativeEvent)
        setAnchorEl(null)
      }}
      className={cn("relative py-1.5 pl-8 pr-2 text-sm", className)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <Check className="h-4 w-4" /> : null}
      </span>
      {children}
    </MenuItem>
  )
})
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

interface DropdownMenuRadioItemProps extends DropdownMenuItemProps {}

const DropdownMenuRadioItem = React.forwardRef<
  HTMLLIElement,
  DropdownMenuRadioItemProps
>(({ className, children, onClick, onSelect, ...props }, ref) => {
  const { setAnchorEl } = React.useContext(DropdownMenuContext)
  return (
    <MenuItem
      ref={ref}
      onClick={(e) => {
        onClick?.(e)
        onSelect?.(e.nativeEvent)
        setAnchorEl(null)
      }}
      className={cn("relative py-1.5 pl-8 pr-2 text-sm", className)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Circle className="h-2 w-2 fill-current" />
      </span>
      {children}
    </MenuItem>
  )
})
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <Divider
    ref={ref as React.Ref<any>}
    component="hr"
    className={cn("-mx-1 my-1", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
    {...props}
  />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

// Pass-throughs to preserve the shadcn compound API surface.
const DropdownMenuGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const DropdownMenuPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const DropdownMenuSub = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const DropdownMenuSubContent = ({
  children,
}: {
  children?: React.ReactNode
}) => <>{children}</>
const DropdownMenuSubTrigger = ({
  children,
}: {
  children?: React.ReactNode
}) => <>{children}</>
const DropdownMenuRadioGroup = ({
  children,
}: {
  children?: React.ReactNode
}) => <>{children}</>

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
