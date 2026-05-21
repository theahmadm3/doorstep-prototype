import * as React from "react"
import MuiAlert, { type AlertProps as MuiAlertProps } from "@mui/material/Alert"
import MuiAlertTitle from "@mui/material/AlertTitle"

import { cn } from "@/lib/utils"

type AlertVariant = "default" | "destructive"

type AlertProps = Omit<MuiAlertProps, "variant" | "severity"> & {
  variant?: AlertVariant
  className?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => (
    <MuiAlert
      ref={ref}
      severity={variant === "destructive" ? "error" : "info"}
      variant="outlined"
      role="alert"
      className={cn(className)}
      {...props}
    >
      {children}
    </MuiAlert>
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <MuiAlertTitle
    ref={ref as React.Ref<HTMLDivElement>}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  >
    {children}
  </MuiAlertTitle>
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
