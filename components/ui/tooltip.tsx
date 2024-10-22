import * as React from "react";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipPortal = TooltipPrimitive.Portal;

const TooltipArrow = TooltipPrimitive.Arrow;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    arrow?: boolean;
    arrowClassName?: string;
  }
>(
  (
    {
      className,
      sideOffset = 4,
      children,
      arrow = false,
      arrowClassName,
      ...props
    },
    ref,
  ) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
      {arrow ? (
        <TooltipArrow className={cn("fill-popover", arrowClassName)} />
      ) : null}
    </TooltipPrimitive.Content>
  ),
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export const BadgeTooltip = ({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

export const ButtonTooltip = ({
  content,
  sideOffset = 0,
  className,
  children,
}: {
  content: string;
  sideOffset?: number;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          sideOffset={sideOffset}
          className={cn("bg-[#474e5a] px-2 py-1 text-white", className)}
        >
          <p>{content}</p>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

export {
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
};
