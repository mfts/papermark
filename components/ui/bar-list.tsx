import { ReactNode } from "react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface BarListProps {
  data: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    value: number;
    secondaryValue?: string;
  }[];
  maxValue: number;
  barBackground?: string;
  hoverBackground?: string;
}

export default function BarList({
  data,
  maxValue,
  barBackground = "bg-indigo-100 dark:bg-indigo-950/50",
  hoverBackground = "hover:bg-gray-100 dark:hover:bg-gray-800",
}: BarListProps) {
  return (
    <div className="grid">
      {data.map((item, idx) => (
        <LineItem
          key={idx}
          {...item}
          maxValue={maxValue}
          barBackground={barBackground}
          hoverBackground={hoverBackground}
        />
      ))}
    </div>
  );
}

function LineItem({
  icon,
  title,
  subtitle,
  value,
  secondaryValue,
  maxValue,
  barBackground,
  hoverBackground,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value: number;
  secondaryValue?: string;
  maxValue: number;
  barBackground: string;
  hoverBackground: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 border-l-2 border-transparent px-4 py-1",
        hoverBackground,
      )}
    >
      <div className="group flex items-center justify-between">
        <div className="relative z-10 flex h-8 w-full min-w-0 max-w-[calc(100%-2rem)] items-center">
          <div className="z-10 flex items-center space-x-3 overflow-hidden px-3">
            {icon}
            <div className="truncate">
              <div className="truncate text-sm text-foreground">{title}</div>
              {subtitle && (
                <div className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <motion.div
            style={{
              width: `${(value / maxValue) * 100}%`,
            }}
            className={cn(
              "absolute h-full origin-left rounded-md",
              barBackground,
            )}
            transition={{ ease: "easeOut", duration: 0.3 }}
            initial={{ transform: "scaleX(0)" }}
            animate={{ transform: "scaleX(1)" }}
          />
          {secondaryValue && (
            <div className="absolute right-2 z-20 text-sm text-muted-foreground">
              {secondaryValue}
            </div>
          )}
        </div>
        <div className="w-8 text-right text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}
