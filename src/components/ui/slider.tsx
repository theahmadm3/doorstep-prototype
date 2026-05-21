"use client"

import * as React from "react"
import MuiSlider from "@mui/material/Slider"

import { cn } from "@/lib/utils"

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min, max, step, ...props }, ref) => (
    <MuiSlider
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      defaultValue={defaultValue}
      onChange={(_, v) => onValueChange?.(Array.isArray(v) ? v : [v])}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  ),
)
Slider.displayName = "Slider"

export { Slider }
