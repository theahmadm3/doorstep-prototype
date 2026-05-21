"use client"

import * as React from "react"
import MuiRadioGroup from "@mui/material/RadioGroup"
import Radio from "@mui/material/Radio"

import { cn } from "@/lib/utils"

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  // Use method signature for bivariance — allows callers to narrow the value type
  onValueChange?(value: string): void;
  className?: string;
  name?: string;
  children?: React.ReactNode;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, ...props }, ref) => (
    <MuiRadioGroup
      ref={ref}
      className={cn("grid gap-2", className)}
      value={value}
      defaultValue={defaultValue}
      onChange={(_, v) => onValueChange?.(v)}
      {...props}
    />
  ),
)
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps {
  value: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => (
    <Radio
      ref={ref as React.Ref<HTMLButtonElement>}
      value={value}
      className={cn(className)}
      size="small"
      {...props}
    />
  ),
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
