import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 border-2 border-slate-900 hover:shadow-md",
        outline:
          "border-2 border-slate-900 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-900 hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-sky-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        xs: "h-8 gap-1 rounded-md px-3 text-xs",
        sm: "h-9 rounded-md gap-1.5 px-4",
        lg: "h-12 rounded-lg px-8 text-lg",
        icon: "size-11",
        "icon-xs": "size-8 rounded-md",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
