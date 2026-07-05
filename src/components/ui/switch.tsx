
import * as React from "react"
import MuiSwitch from "@mui/material/Switch"

import { cn } from "@/lib/utils"

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => (
    <MuiSwitch
      ref={ref as React.Ref<HTMLButtonElement>}
      className={cn(className)}
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
)
Switch.displayName = "Switch"

export { Switch }
