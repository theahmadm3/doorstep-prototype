"use client"

import * as React from "react"
import Collapse from "@mui/material/Collapse"

type CollapsibleContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({
  open: false,
  setOpen: () => {},
})

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    { open, defaultOpen, onOpenChange, disabled, children, ...props },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = React.useState(
      defaultOpen ?? false
    )
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (disabled) return
        if (!isControlled) setInternalOpen(next)
        onOpenChange?.(next)
      },
      [disabled, isControlled, onOpenChange]
    )

    return (
      <CollapsibleContext.Provider value={{ open: isOpen, setOpen }}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<
  HTMLElement,
  CollapsibleTriggerProps
>(({ asChild, children, onClick, ...props }, ref) => {
  const { open, setOpen } = React.useContext(CollapsibleContext)

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e as React.MouseEvent<HTMLElement, MouseEvent>)
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>
    return React.cloneElement(child, {
      ref,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e)
        setOpen(!open)
      },
    })
  }

  return (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ children, ...props }, ref) => {
  const { open } = React.useContext(CollapsibleContext)
  return (
    <Collapse in={open} unmountOnExit>
      <div ref={ref} {...props}>
        {children}
      </div>
    </Collapse>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
