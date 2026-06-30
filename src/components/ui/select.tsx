"use client"

import * as React from "react"
import MuiSelect from "@mui/material/Select"
import MuiMenuItem from "@mui/material/MenuItem"
import Divider from "@mui/material/Divider"
import ListSubheader from "@mui/material/ListSubheader"

import { cn } from "@/lib/utils"

/**
 * shadcn Select compound API rebuilt on MUI Select.
 *
 * Usage stays identical:
 *   <Select value onValueChange defaultValue disabled>
 *     <SelectTrigger><SelectValue placeholder="x" /></SelectTrigger>
 *     <SelectContent>
 *       <SelectItem value="a">A</SelectItem>
 *     </SelectContent>
 *   </Select>
 *
 * Bridge: `Select` renders ONE MUI Select. It walks its children to extract
 * (a) the placeholder from the SelectValue inside SelectTrigger, and
 * (b) the SelectContent subtree, whose children become the MUI Select's
 * MenuItem children. The trigger/value/content components are markers that
 * `Select` interprets; rendering them directly returns pass-throughs.
 */

// --- Marker components (interpreted by Select; safe to render as pass-throughs) ---

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string
}
const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ children }, _ref) => <>{children}</>
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps {
  placeholder?: React.ReactNode
  children?: React.ReactNode
}
const SelectValue = (_props: SelectValueProps) => null
SelectValue.displayName = "SelectValue"

interface SelectContentProps {
  className?: string
  children?: React.ReactNode
  position?: string
}
const SelectContent = ({ children }: SelectContentProps) => <>{children}</>
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLLIElement> {
  value: string
  disabled?: boolean
}
const SelectItem = React.forwardRef<HTMLLIElement, SelectItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => (
    <MuiMenuItem
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </MuiMenuItem>
  )
)
SelectItem.displayName = "SelectItem"

const SelectLabel = ({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) => (
  <ListSubheader className={cn("text-sm font-semibold", className)}>
    {children}
  </ListSubheader>
)
SelectLabel.displayName = "SelectLabel"

const SelectSeparator = ({ className }: { className?: string }) => (
  <Divider className={cn("my-1", className)} />
)
SelectSeparator.displayName = "SelectSeparator"

const SelectGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)
SelectGroup.displayName = "SelectGroup"

const SelectScrollUpButton = () => null
SelectScrollUpButton.displayName = "SelectScrollUpButton"
const SelectScrollDownButton = () => null
SelectScrollDownButton.displayName = "SelectScrollDownButton"

// --- Helpers to walk the compound tree ---

// Shallow search: direct children only.
function findChildByType(
  children: React.ReactNode,
  type: React.ElementType
): React.ReactElement | undefined {
  let found: React.ReactElement | undefined
  React.Children.forEach(children, (child) => {
    if (found) return
    if (React.isValidElement(child) && child.type === type) {
      found = child
    }
  })
  return found
}

// Deep search: recurses through nested elements (e.g. FormControl wrappers).
function findDescendantByType(
  children: React.ReactNode,
  type: React.ElementType
): React.ReactElement | undefined {
  let found: React.ReactElement | undefined
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return
    if (child.type === type) {
      found = child
      return
    }
    const nested = (child.props as { children?: React.ReactNode }).children
    if (nested) {
      const deeper = findDescendantByType(nested, type)
      if (deeper) found = deeper
    }
  })
  return found
}

function extractPlaceholder(children: React.ReactNode): React.ReactNode {
  const value = findDescendantByType(children, SelectValue)
  return value
    ? (value.props as SelectValueProps).placeholder
    : undefined
}

function extractTriggerId(children: React.ReactNode): string | undefined {
  const trigger = findDescendantByType(children, SelectTrigger)
  return trigger ? (trigger.props as SelectTriggerProps).id : undefined
}

// --- Root ---

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  name?: string
  className?: string
  children?: React.ReactNode
}

const Select = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  name,
  className,
  children,
}: SelectProps) => {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<string>(
    defaultValue ?? ""
  )
  const currentValue = isControlled ? value ?? "" : internalValue

  const placeholder = extractPlaceholder(children)
  const triggerId = extractTriggerId(children)

  // Items live inside SelectContent.
  const content = findChildByType(children, SelectContent)
  const items = content
    ? (content.props as SelectContentProps).children
    : null

  return (
    <MuiSelect
      id={triggerId}
      value={currentValue}
      disabled={disabled}
      required={required}
      name={name}
      displayEmpty
      fullWidth
      size="small"
      className={cn(className)}
      onChange={(e) => {
        const next = String(e.target.value)
        if (!isControlled) setInternalValue(next)
        onValueChange?.(next)
      }}
      renderValue={(selected) => {
        if (selected === undefined || selected === null || selected === "") {
          return (
            <span className="text-muted-foreground">{placeholder}</span>
          )
        }
        // Find the matching item's label for display.
        let label: React.ReactNode = String(selected)
        React.Children.forEach(items, (child) => {
          if (
            React.isValidElement(child) &&
            (child.props as SelectItemProps).value === selected
          ) {
            label = (child.props as SelectItemProps).children
          }
        })
        return label
      }}
    >
      {items}
    </MuiSelect>
  )
}
Select.displayName = "Select"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
