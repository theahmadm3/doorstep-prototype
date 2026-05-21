import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import MuiButton from "@mui/material/Button";
import { cn } from "@/lib/utils";

// Kept for callers that import buttonVariants to style links/anchors.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // asChild path: keep Tailwind styling so a wrapped <Link>/<a> looks right.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        />
      );
    }
    // Default path: MUI Button, with Tailwind classes forwarded for fine-tuning.
    // Cast props: our public API mirrors native button attributes (incl. the HTML
    // `color` attr) which MUI Button's stricter prop types reject. The shadcn-style
    // `variant`/`size` strings are intentionally passed through too. Behavior is
    // unchanged; this only satisfies MUI's overload typing.
    return (
      <MuiButton
        ref={ref}
        className={cn(className)}
        {...(props as React.ComponentProps<typeof MuiButton>)}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
