"use client"

import * as React from "react"
import MuiCheckbox from "@mui/material/Checkbox"

import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  "aria-label"?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => (
    <MuiCheckbox
      ref={ref as React.Ref<HTMLButtonElement>}
      className={cn(className)}
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      size="small"
      {...props}
    />
  ),
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
