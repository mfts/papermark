import { Dispatch, SetStateAction, useId } from "react";

import { LayoutGroup, motion } from "motion/react";

import { cn } from "@/lib/utils";

export function TabSelect<T extends string>({
  options,
  selected,
  onSelect,
  className,
}: {
  options: { id: T; label: string }[];
  selected: string | null;
  onSelect?: Dispatch<SetStateAction<T>> | ((id: T) => void);
  className?: string;
}) {
  const layoutGroupId = useId();

  return (
    <div className={cn("flex text-sm", className)}>
      <LayoutGroup id={layoutGroupId}>
        {options.map(({ id, label }) => (
          <div key={id} className="relative">
            <button
              type="button"
              onClick={() => onSelect?.(id)}
              className={cn(
                "p-4 transition-colors duration-75",
                id === selected
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-selected={id === selected}
            >
              {label}
            </button>
            {id === selected && (
              <motion.div
                layoutId="indicator"
                transition={{
                  duration: 0.1,
                }}
                className="absolute bottom-0 w-full px-1.5"
              >
                <div className="h-0.5 bg-black dark:bg-white" />
              </motion.div>
            )}
          </div>
        ))}
      </LayoutGroup>
    </div>
  );
}
