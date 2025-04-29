import { useEffect, useState } from "react";



import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { PRESET_OPTIONS, formatExpirationTime } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartDateTimePicker } from "@/components/ui/smart-date-time-picker";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function ExpirationInSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE & {
    expiresIn?: { value: number; type: "natural" | "normal" } | null;
  };
  setData: React.Dispatch<
    React.SetStateAction<
      DEFAULT_LINK_TYPE & {
        expiresIn?: { value: number; type: "natural" | "normal" } | null;
      }
    >
  >;
}) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  // Initialize state based on existing expiresIn data
  useEffect(() => {
    if (!data.expiresIn) {
      setEnabled(false);
      setSelectedPreset("");
      setCustomDate(null);
      return;
    }

    setEnabled(true);

    if (data.expiresIn.type === "normal") {
      const matchingPreset = PRESET_OPTIONS.find(
        (option) => option.value === data.expiresIn?.value,
      );

      if (matchingPreset) {
        setSelectedPreset(matchingPreset.value.toString());
        setCustomDate(null);
      } else {
        const futureDate = new Date();
        futureDate.setSeconds(futureDate.getSeconds() + data.expiresIn.value);
        setSelectedPreset("");
        setCustomDate(futureDate);
      }
    } else if (data.expiresIn.type === "natural") {
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + data.expiresIn.value);
      setSelectedPreset("");
      setCustomDate(futureDate);
    }
  }, [data.expiresIn]);

  const handleEnableExpiration = () => {
    if (enabled) {
      setData({
        ...data,
        expiresIn: null,
        expiresAt: null,
      });
      setSelectedPreset("");
      setError(null);
      setCustomDate(null);
    } else {
      // Enable with default 7 days expiration
      setData({
        ...data,
        expiresIn: { value: 604800, type: "normal" },
        expiresAt: null,
      });
      setSelectedPreset("604800");
      setError(null);
      setCustomDate(null);
    }
    setEnabled(!enabled);
  };

  const handlePresetChange = (value: string) => {
    const seconds = parseInt(value);
    if (!isNaN(seconds)) {
      setData({
        ...data,
        expiresIn: { value: seconds, type: "normal" },
        expiresAt: null,
      });
      setCustomDate(null);
      setSelectedPreset(value);
      setError(null);
    }
  };

  const handleCustomDateChange = (date: Date | null) => {
    if (!date) {
      setData({
        ...data,
        expiresIn: null,
        expiresAt: null,
      });
      setCustomDate(null);
      setSelectedPreset("");
      setError(null);
      return;
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.ceil(diffMs / 1000);

    if (diffSeconds <= 0) {
      setError("Please enter a future duration");
      return;
    }

    setData({
      ...data,
      expiresIn: { value: diffSeconds, type: "natural" },
      expiresAt: null,
    });
    setCustomDate(date);
    setSelectedPreset("");
    setError(null);
  };

  // Custom formatter to show only the duration
  const formatValue = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.ceil(diffMs / 1000);
    return "in " + formatExpirationTime(diffSeconds);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Link Expires After"
        enabled={enabled}
        link="https://www.papermark.com/help/article/expiration-date"
        action={handleEnableExpiration}
        tooltipContent="Set how long the link will remain active after creation."
      />

      {enabled && (
        <motion.div className="mt-3 space-y-3" {...FADE_IN_ANIMATION_SETTINGS}>
          <div className="flex flex-col space-y-4">
            <SmartDateTimePicker
              value={customDate}
              onChange={handleCustomDateChange}
              placeholder='E.g. "in 2 hours" or "in 2 days"'
              formatValue={formatValue}
              showCalendarIcon={false}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-500">Or</span>
              </div>
            </div>

            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiration time" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {data.expiresIn && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Links will expire in{" "}
                  {formatExpirationTime(data.expiresIn.value)} after creation
                </div>
              </div>
            )}

            {error && <div className="text-xs text-red-500">{error}</div>}
          </div>
        </motion.div>
      )}
    </div>
  );
}