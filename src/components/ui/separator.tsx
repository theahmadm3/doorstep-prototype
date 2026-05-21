import * as React from "react"
import Divider from "@mui/material/Divider"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & {
    orientation?: "horizontal" | "vertical"
    decorative?: boolean
  }
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <Divider
      ref={ref}
      orientation={orientation}
      role={decorative ? "presentation" : "separator"}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
