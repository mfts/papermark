import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm",
          className,
        )}
        ref={ref}
        data-1p-ignore
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
