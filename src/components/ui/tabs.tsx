"use client"

import * as React from "react"
import MuiTabs from "@mui/material/Tabs"
import MuiTab from "@mui/material/Tab"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string | undefined
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
  value: undefined,
  setValue: () => {},
})

interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value, defaultValue, onValueChange, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | undefined>(
      defaultValue
    )
    const isControlled = value !== undefined
    const activeValue = isControlled ? value : internalValue

    const setValue = React.useCallback(
      (next: string) => {
        if (!isControlled) setInternalValue(next)
        onValueChange?.(next)
      },
      [isControlled, onValueChange]
    )

    return (
      <TabsContext.Provider value={{ value: activeValue, setValue }}>
        <div ref={ref} className={cn(className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, style, ...props }, ref) => {
    const { value, setValue } = React.useContext(TabsContext)
    return (
      <MuiTabs
        ref={ref as React.Ref<HTMLDivElement>}
        value={value ?? false}
        onChange={(_e, next) => setValue(String(next))}
        variant="scrollable"
        scrollButtons="auto"
        style={style}
        className={cn(className)}
      >
        {children}
      </MuiTabs>
    )
  }
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps {
  value: string
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

const TabsTrigger = React.forwardRef<HTMLDivElement, TabsTriggerProps>(
  ({ value, className, disabled, children, ...props }, ref) => (
    <MuiTab
      ref={ref as React.Ref<HTMLDivElement>}
      value={value}
      label={children}
      disabled={disabled}
      className={cn(className)}
      {...props}
    />
  )
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { value: activeValue } = React.useContext(TabsContext)
    if (value !== activeValue) return null
    return (
      <div
        ref={ref}
        className={cn("mt-2 focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
