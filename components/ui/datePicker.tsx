"use client";

import * as React from "react";

import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

import { Label } from "./label";

interface DatePickerWithPresetsProps {
  title?: string;
  value?: Date;
  startDate?: Date;
  defaultDate?: Date;
  onChange: (date: Date) => void;
  presets?: { label: string; value: number }[];
}

export const DatePickerWithPresets: React.FC<DatePickerWithPresetsProps> = ({
  title,
  value,
  onChange,
  startDate,
  defaultDate,
  presets = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "In 3 days", value: 3 },
    { label: "In a week", value: 7 },
    { label: "In 2 weeks", value: 14 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
    {
      label: "End of this month",
      value:
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
        ).getDate() - new Date().getDate(),
    },
    {
      label: "End of next month",
      value:
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
        ).getDate() -
        new Date().getDate() +
        new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate(),
    },
    { label: "In 6 months", value: 180 },
    { label: "In a year", value: 365 },
  ],
}) => {
  const [month, setMonth] = React.useState<Date | undefined>(
    value || new Date(),
  );

  React.useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon />
          <Label>
            {value
              ? startDate
                ? `To ${format(value, "PP")}`
                : `From ${format(value, "PP")}`
              : title || "Select Date"}
          </Label>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        {/* Dropdown for selecting preset dates */}
        <Select
          onValueChange={(val) => {
            const newDate = addDays(
              startDate ? startDate : new Date(),
              parseInt(val),
            );
            onChange(newDate);
            setMonth(newDate); // Update calendar month
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a preset" />
          </SelectTrigger>
          <SelectContent position="popper">
            {presets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value.toString()}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Calendar for selecting a custom date */}
        <div className="rounded-md border">
          <Calendar
            mode="single"
            selected={value ?? defaultDate}
            month={month ?? defaultDate}
            onMonthChange={setMonth}
            fromDate={startDate}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setMonth(date);
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
