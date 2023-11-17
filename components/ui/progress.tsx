import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    text?: string;
  }
>(({ className, value, text, ...props }, ref) => {

const textColor = `linear-gradient(to right, 
  text-background ${value || 0}%, 
  text-foreground ${value || 0}%
)`;


return (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
    {text ? (
      <div className="absolute inset-0 flex py-2 items-center justify-center">
        <div className="overflow-hidden absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-foreground">{text}</span>
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: `inset(0 ${100 - (value || 0)}% 0 0)` }}
        >
          <span className="text-xs text-background">{text}</span>
        </div>
      </div>
    ) : null}
  </ProgressPrimitive.Root>
);});
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
