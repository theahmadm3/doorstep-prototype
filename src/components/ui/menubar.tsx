"use client"

import * as React from "react"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Divider from "@mui/material/Divider"
import { Check, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

type MenubarMenuContextValue = {
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
  open: boolean
}

const MenubarMenuContext = React.createContext<MenubarMenuContextValue>({
  anchorEl: null,
  setAnchorEl: () => {},
  open: false,
})

const Menubar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = "Menubar"

const MenubarMenu = ({ children }: { children?: React.ReactNode }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  return (
    <MenubarMenuContext.Provider
      value={{ anchorEl, setAnchorEl, open: Boolean(anchorEl) }}
    >
      {children}
    </MenubarMenuContext.Provider>
  )
}

interface MenubarTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {}

const MenubarTrigger = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { setAnchorEl } = React.useContext(MenubarMenuContext)
    return (
      <button
        type="button"
        ref={ref}
        onClick={(e) => {
          onClick?.(e)
          setAnchorEl(e.currentTarget)
        }}
        className={cn(
          "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
MenubarTrigger.displayName = "MenubarTrigger"

interface MenubarContentProps {
  className?: string
  children?: React.ReactNode
  align?: "start" | "center" | "end"
  alignOffset?: number
  sideOffset?: number
}

const MenubarContent = React.forwardRef<HTMLDivElement, MenubarContentProps>(
  ({ className, children, align = "start" }, _ref) => {
    const { anchorEl, open, setAnchorEl } = React.useContext(MenubarMenuContext)
    const horizontal =
      align === "end" ? "right" : align === "center" ? "center" : "left"
    return (
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal }}
        transformOrigin={{ vertical: "top", horizontal }}
        slotProps={{ paper: { className: cn("min-w-[12rem]", className) } }}
      >
        {children}
      </Menu>
    )
  }
)
MenubarContent.displayName = "MenubarContent"

interface MenubarItemProps
  extends Omit<React.HTMLAttributes<HTMLLIElement>, "onSelect"> {
  inset?: boolean
  disabled?: boolean
  onSelect?: (event: Event) => void
}

const MenubarItem = React.forwardRef<HTMLLIElement, MenubarItemProps>(
  ({ className, inset, disabled, onClick, onSelect, children, ...props }, ref) => {
    const { setAnchorEl } = React.useContext(MenubarMenuContext)
    return (
      <MenuItem
        ref={ref}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e)
          onSelect?.(e.nativeEvent)
          setAnchorEl(null)
        }}
        className={cn("gap-2 text-sm", inset && "pl-8", className)}
        {...props}
      >
        {children}
      </MenuItem>
    )
  }
)
MenubarItem.displayName = "MenubarItem"

interface MenubarCheckboxItemProps extends MenubarItemProps {
  checked?: boolean
}

const MenubarCheckboxItem = React.forwardRef<
  HTMLLIElement,
  MenubarCheckboxItemProps
>(({ className, children, checked, onClick, onSelect, ...props }, ref) => {
  const { setAnchorEl } = React.useContext(MenubarMenuContext)
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
MenubarCheckboxItem.displayName = "MenubarCheckboxItem"

const MenubarRadioItem = React.forwardRef<HTMLLIElement, MenubarItemProps>(
  ({ className, children, onClick, onSelect, ...props }, ref) => {
    const { setAnchorEl } = React.useContext(MenubarMenuContext)
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
  }
)
MenubarRadioItem.displayName = "MenubarRadioItem"

interface MenubarLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const MenubarLabel = React.forwardRef<HTMLDivElement, MenubarLabelProps>(
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
MenubarLabel.displayName = "MenubarLabel"

const MenubarSeparator = React.forwardRef<
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
MenubarSeparator.displayName = "MenubarSeparator"

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "ml-auto text-xs tracking-widest text-muted-foreground",
      className
    )}
    {...props}
  />
)
MenubarShortcut.displayName = "MenubarShortcut"

// Pass-throughs to preserve the shadcn compound API surface.
const MenubarGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const MenubarPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const MenubarSub = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const MenubarSubContent = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const MenubarSubTrigger = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
const MenubarRadioGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
