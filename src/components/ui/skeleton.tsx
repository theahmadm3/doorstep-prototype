import * as React from "react"
import MuiSkeleton from "@mui/material/Skeleton"

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <MuiSkeleton
      variant="rectangular"
      animation="wave"
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
