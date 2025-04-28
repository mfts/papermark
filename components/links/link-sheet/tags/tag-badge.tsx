import { TagIcon } from "lucide-react";

import { TagColorProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TagBadge({
  name,
  color,
  withIcon,
  plus,
  className,
  isSelected,
}: {
  name?: string;
  color: TagColorProps;
  withIcon?: boolean;
  plus?: number;
  className?: string;
  isSelected?: boolean;
}) {
  return (
    <span
      className={cn(
        "my-auto block whitespace-nowrap rounded-md border px-2 py-0.5 text-sm",
        (withIcon || plus) &&
          "flex items-center gap-x-1.5 p-1.5 sm:rounded-md sm:px-2 sm:py-0.5",
        COLORS_LIST.find((c) => c.color === color)?.css,
        isSelected && "border-2 bg-transparent",
        className,
      )}
    >
      {withIcon && (
        <TagIcon
          className={cn(
            "!size-5 shrink-0 p-0.5 dark:text-primary-foreground",
            isSelected && `bg-${color}-100 rounded-sm border border-gray-200`,
          )}
        />
      )}
      {name && (
        <p {...(withIcon && { className: "hidden sm:inline-block" })}>
          {name || ""}
        </p>
      )}
      {!!plus && (
        <span className="hidden sm:block">
          <span className="pr-1.5 opacity-30 md:pl-1 md:pr-2.5">|</span>+{plus}
        </span>
      )}
    </span>
  );
}

export const COLORS_LIST: { color: TagColorProps; css: string }[] = [
  {
    color: "red",
    css: "border-red-300 bg-red-100 text-red-500",
  },
  {
    color: "yellow",
    css: "border-yellow-300 bg-yellow-100 text-yellow-500",
  },
  {
    color: "green",
    css: "border-emerald-300 bg-emerald-100 text-emerald-500",
  },
  {
    color: "blue",
    css: "border-blue-300 bg-blue-100 text-blue-500",
  },
  {
    color: "purple",
    css: "border-purple-300 bg-purple-100 text-purple-500",
  },
  {
    color: "slate",
    css: "border-stone-300 bg-stone-100 text-stone-500",
  },
  {
    color: "fuchsia",
    css: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-500",
  },
];

export function randomBadgeColor() {
  const randomIndex = Math.floor(Math.random() * COLORS_LIST.length);
  return COLORS_LIST[randomIndex].color;
}
