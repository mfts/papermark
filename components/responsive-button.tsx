import React, { cloneElement } from "react";

import { useBreakpoint } from "@/lib/hooks/use-breakpoint";

import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResponsiveButtonProps extends ButtonProps {
  icon: React.ReactElement;
  text: string;
  breakpoint?: number;
}

export const ResponsiveButton = React.forwardRef<
  HTMLButtonElement,
  ResponsiveButtonProps
>(({ icon, text, breakpoint = 1024, ...props }, ref) => {
  const isSmaller = useBreakpoint(breakpoint);

  if (isSmaller) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button ref={ref} {...props}>
              {icon}
              <span className="sr-only">{text}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const iconWithAriaHidden = cloneElement(icon, {
    "aria-hidden": "true",
  });

  return (
    <Button ref={ref} {...props}>
      {iconWithAriaHidden}
      {text}
    </Button>
  );
});

ResponsiveButton.displayName = "ResponsiveButton";
