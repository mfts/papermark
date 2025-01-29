import { CalendarDays, CalendarIcon, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TIME_RANGES = [
  { value: "24h", label: "Last 24 hours", shortcut: "D" },
  { value: "7d", label: "Last 7 days", shortcut: "W" },
  { value: "30d", label: "Last 30 days", shortcut: "M" },
  // { value: "90d", label: "Last 3 months", shortcut: "Q" },
  // { value: "1y", label: "Last 12 months", shortcut: "Y" },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];

interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  const selectedRange = TIME_RANGES.find((range) => range.value === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal sm:inline-flex sm:min-w-[200px] md:w-fit"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="!size-4" />
            <span>{selectedRange?.label}</span>
          </div>
          <ChevronDown className="!size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1" align="end">
        <div className="grid">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={range.value === value ? "secondary" : "ghost"}
              className="justify-between"
              onClick={() => onChange(range.value)}
            >
              <span>{range.label}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {range.shortcut}
              </kbd>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
