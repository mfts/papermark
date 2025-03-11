import { Tag } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <Button
      size="sm"
      variant="secondary"
      className={cn(
        "my-auto block cursor-pointer whitespace-nowrap !rounded-full border px-2 py-0.5 text-sm",
        (withIcon || plus) &&
          "flex items-center gap-x-1.5 p-1.5 sm:rounded-md sm:px-2 sm:py-0.5",
        color === "red" && "border-red-300 bg-red-100 text-red-600",
        color === "yellow" && "border-yellow-300 bg-yellow-100 text-yellow-600",
        color === "green" && "border-green-300 bg-green-100 text-green-600",
        color === "blue" && "border-blue-300 bg-blue-100 text-blue-600",
        color === "purple" && "border-purple-300 bg-purple-100 text-purple-600",
        color === "slate" && "border-stone-300 bg-stone-400 text-stone-600",
        color === "fuchsia" &&
          "border-fuchsia-300 bg-fuchsia-400 text-fuchsia-600",
        isSelected && "border-2 bg-transparent",
        className,
      )}
    >
      {withIcon && (
        <Tag
          className={cn(
            "shrink-0 p-0.5 dark:text-primary-foreground",
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
    </Button>
  );
}

export const COLORS_LIST: { color: TagColorProps; css: string }[] = [
  {
    color: "red",
    css: "bg-red-100 text-red-600",
  },
  {
    color: "yellow",
    css: "bg-yellow-100 text-yellow-600",
  },
  {
    color: "green",
    css: "bg-green-100 text-green-600",
  },
  {
    color: "blue",
    css: "bg-blue-100 text-blue-600",
  },
  {
    color: "purple",
    css: "bg-purple-100 text-purple-600",
  },
  {
    color: "slate",
    css: "bg-slate-100 text-slate-600",
  },
  {
    color: "fuchsia",
    css: "bg-fuchsia-100 text-fuchsia-600",
  },
];

export function randomBadgeColor() {
  const randomIndex = Math.floor(Math.random() * COLORS_LIST.length);
  return COLORS_LIST[randomIndex].color;
}
