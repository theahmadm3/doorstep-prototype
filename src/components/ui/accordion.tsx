"use client"

import * as React from "react"
import MuiAccordion from "@mui/material/Accordion"
import MuiAccordionSummary from "@mui/material/AccordionSummary"
import MuiAccordionDetails from "@mui/material/AccordionDetails"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

import { cn } from "@/lib/utils"

type AccordionContextValue = {
  type: "single" | "multiple"
  collapsible: boolean
  isExpanded: (value: string) => boolean
  toggle: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue>({
  type: "single",
  collapsible: true,
  isExpanded: () => false,
  toggle: () => {},
})

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  collapsible?: boolean
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = "single",
      collapsible = false,
      value,
      defaultValue,
      onValueChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const toArray = (v: string | string[] | undefined): string[] =>
      v === undefined ? [] : Array.isArray(v) ? v : [v]

    const [internal, setInternal] = React.useState<string[]>(
      toArray(defaultValue)
    )
    const isControlled = value !== undefined
    const expandedValues = isControlled ? toArray(value) : internal

    const commit = React.useCallback(
      (next: string[]) => {
        if (!isControlled) setInternal(next)
        if (onValueChange) {
          onValueChange(type === "single" ? (next[0] ?? "") : next)
        }
      },
      [isControlled, onValueChange, type]
    )

    const isExpanded = React.useCallback(
      (val: string) => expandedValues.includes(val),
      [expandedValues]
    )

    const toggle = React.useCallback(
      (val: string) => {
        const currentlyOpen = expandedValues.includes(val)
        if (type === "single") {
          if (currentlyOpen) {
            commit(collapsible ? [] : [val])
          } else {
            commit([val])
          }
        } else {
          commit(
            currentlyOpen
              ? expandedValues.filter((v) => v !== val)
              : [...expandedValues, val]
          )
        }
      },
      [collapsible, commit, expandedValues, type]
    )

    return (
      <AccordionContext.Provider
        value={{ type, collapsible, isExpanded, toggle }}
      >
        <div ref={ref} className={cn(className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

type AccordionItemContextValue = { value: string }
const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  value: "",
})

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children }, ref) => {
    const { isExpanded, toggle } = React.useContext(AccordionContext)
    return (
      <AccordionItemContext.Provider value={{ value }}>
        <MuiAccordion
          ref={ref as React.Ref<HTMLDivElement>}
          disableGutters
          elevation={0}
          square
          expanded={isExpanded(value)}
          onChange={() => toggle(value)}
          className={cn("border-b", className)}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          {children as NonNullable<React.ReactNode>}
        </MuiAccordion>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionTrigger = React.forwardRef<
  HTMLDivElement,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <MuiAccordionSummary
    ref={ref as React.Ref<HTMLDivElement>}
    expandIcon={<ExpandMoreIcon className="h-4 w-4 shrink-0" />}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-medium",
      className
    )}
    {...props}
  >
    {children}
  </MuiAccordionSummary>
))
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <MuiAccordionDetails ref={ref as React.Ref<HTMLDivElement>} sx={{ p: 0 }} {...props}>
    <div className={cn("pb-4 pt-0 text-sm", className)}>{children}</div>
  </MuiAccordionDetails>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
