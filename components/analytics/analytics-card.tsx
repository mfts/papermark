import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  icon?: ReactNode;
  columnHeaders?: {
    label: string;
    width?: string;
  }[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AnalyticsCard({
  title,
  icon,
  columnHeaders,
  children,
  className,
  contentClassName,
}: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        "relative z-0 overflow-hidden border border-border bg-card sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border py-4 pl-5 pr-4">
        <h3 className="text-sm font-medium">{title}</h3>
        {columnHeaders ? (
          <div className="flex items-center justify-end space-x-1 text-sm text-muted-foreground">
            {columnHeaders.map((header, index) => (
              <div key={index} className={cn("text-xs", header.width)}>
                {header.label}
              </div>
            ))}
          </div>
        ) : icon ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            {icon}
          </div>
        ) : null}
      </div>
      <div className={cn("py-4", contentClassName)}>{children}</div>
    </div>
  );
}
