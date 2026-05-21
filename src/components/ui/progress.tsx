import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props}>
    <LinearProgress variant="determinate" value={value ?? 0} />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
