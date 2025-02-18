import { useRouter } from "next/navigation";

import { Ref, useState } from "react";

import { addDays, format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { start } from "repl";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DatePickerWithPresets } from "../ui/datePicker";
import { Separator } from "../ui/separator";

const TIME_RANGES = [
  { value: "24h", label: "Last 24 hours", shortcut: "D" },
  { value: "7d", label: "Last 7 days", shortcut: "W" },
  { value: "30d", label: "Last 30 days", shortcut: "M" },
  { value: "custom", label: "Custom Date", shortcut: "C" },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];
interface CustomRange {
  start: Date;
  end: Date;
}
interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  customRange: CustomRange;
  setCustomRange: React.Dispatch<React.SetStateAction<CustomRange>>;
  slug: React.MutableRefObject<boolean>;
}

export function TimeRangeSelect({
  value,
  onChange,
  customRange,
  setCustomRange,
  slug,
}: TimeRangeSelectProps) {
  const [isDatePickerShow, setIsDatePickerShow] = useState(false);
  const selectedRange =
    value !== "custom"
      ? TIME_RANGES.find((range) => range.value === value)
      : null;

  const handleSelectOption = (value: TimeRange) => {
    const isCustom = value === "custom";
    onChange(value);
    setIsDatePickerShow(isCustom);
  };

  const handleDateChange = (key: "start" | "end", date: Date) => {
    setCustomRange((prev: CustomRange) => ({ ...prev, [key]: date }));
    slug.current = false;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal sm:inline-flex sm:min-w-[200px] md:w-fit"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="!size-4" />
            <span>
              {selectedRange
                ? selectedRange.label
                : customRange.start && customRange.end
                  ? `${format(customRange.start, "PP")} - ${format(customRange.end, "PP")}`
                  : "Select Date Range"}
            </span>
          </div>
          <ChevronDown className="!size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-1" align="end">
        <div className="grid gap-0.5">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={range.value === value ? "secondary" : "ghost"}
              className="justify-between"
              onClick={() => handleSelectOption(range.value)}
            >
              <span>{range.label}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {range.shortcut}
              </kbd>
            </Button>
          ))}
        </div>
        {isDatePickerShow && (
          <>
            <Separator className="mt-2" />
            <div className="mt-2 grid gap-0.5">
              <DatePickerWithPresets
                value={customRange.start}
                defaultDate={customRange.start}
                onChange={(date) => handleDateChange("start", date)}
                title="Start Date"
              />
              <DatePickerWithPresets
                startDate={customRange.start}
                value={customRange.end}
                defaultDate={customRange.end}
                onChange={(date) => handleDateChange("end", date)}
                title="End Date"
              />
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
