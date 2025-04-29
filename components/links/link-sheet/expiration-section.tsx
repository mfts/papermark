import { useCallback, useEffect, useState } from "react";

import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import {
  WITH_CUSTOM_PRESET_OPTION,
  formatExpirationTime,
  getDateTimeLocal,
} from "@/lib/utils";

import { Input } from "@/components/ui/input";
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

export default function ExpirationSection({
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
  const { expiresAt } = data;
  console.log("expiresAt", expiresAt);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  // Initialize state based on existing expiration
  useEffect(() => {
    setEnabled(!!expiresAt && !data.expiresIn);

    if (expiresAt && !data.expiresIn) {
      const now = new Date();
      const expirationDate =
        typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
      const diffInSeconds = Math.floor(
        (expirationDate.getTime() - now.getTime()) / 1000,
      );

      const matchingPreset = WITH_CUSTOM_PRESET_OPTION.find(
        (option: { value: number | string }) =>
          option.value !== "custom" &&
          Math.abs(parseInt(option.value.toString()) - diffInSeconds) < 60,
      );

      if (matchingPreset) {
        setSelectedPreset(matchingPreset.value.toString());
      } else {
        setSelectedPreset("custom");
        setCustomDate(expirationDate);
      }
    }
  }, [expiresAt, data.expiresIn]);

  const handleEnableExpiration = () => {
    if (enabled) {
      setData({ ...data, expiresAt: null });
      setSelectedPreset("");
      setError(null);
      setCustomDate(null);
      setEnabled(false);
    } else {
      const defaultExpiration = new Date();
      defaultExpiration.setDate(defaultExpiration.getDate() + 7); // Default to 7 days
      setData({
        ...data,
        expiresIn: null,
        expiresAt: defaultExpiration,
      });
      setSelectedPreset("86400"); // 1 day in seconds
      setCustomDate(defaultExpiration);
      setEnabled(true);
    }
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    setError(null);
    if (value === "custom") {
      return;
    }

    const seconds = parseInt(value);
    if (!isNaN(seconds)) {
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + seconds);
      setData({ ...data, expiresAt: newExpiresAt });
      setCustomDate(newExpiresAt);
    }
  };

  const handleCustomDateChange = (date: Date | null) => {
    if (!date) {
      setError("Please select a valid date");
      return;
    }

    const now = new Date();
    if (date <= now) {
      setData({ ...data, expiresAt: new Date(now.getTime() + 86400) }); // 1 day
      setError("Expiration time must be in the future");
      return;
    }

    setData({ ...data, expiresAt: date });
    setCustomDate(date);
    setSelectedPreset("custom");
    setError(null);
  };

  const expirationTime = useCallback((date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const diffInSeconds = Math.floor(
      (dateObj.getTime() - now.getTime()) / 1000,
    );
    return formatExpirationTime(diffInSeconds);
  }, []);

  const formatNaturalExpiration = useCallback((date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;

    const formattedDate = dateObj.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const formattedTime = dateObj.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (dateObj.toDateString() === now.toDateString()) {
      return `today at ${formattedTime}`;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateObj.toDateString() === tomorrow.toDateString()) {
      return `tomorrow at ${formattedTime}`;
    }

    return `on ${formattedDate} at ${formattedTime}`;
  }, []);

  return (
    <div className="pb-5">
      <LinkItem
        title="Expiration Date"
        enabled={enabled}
        link="https://www.papermark.com/help/article/expiration-date"
        action={handleEnableExpiration}
        tooltipContent="Set a date after which the link will no longer be accessible."
      />

      {enabled && (
        <motion.div className="mt-3 space-y-3" {...FADE_IN_ANIMATION_SETTINGS}>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <SmartDateTimePicker
                value={customDate}
                onChange={handleCustomDateChange}
                placeholder='e.g. "in 2 days", "next Friday at 3pm", "December 25th at 9am"'
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
                  <SelectValue placeholder="Select from preset times" />
                </SelectTrigger>
                <SelectContent>
                  {WITH_CUSTOM_PRESET_OPTION.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPreset === "custom" ? (
                <Input
                  type="datetime-local"
                  id="expiresAt"
                  name="expiresAt"
                  min={getDateTimeLocal()}
                  value={expiresAt ? getDateTimeLocal(expiresAt) : ""}
                  step="60"
                  onChange={(e) =>
                    handleCustomDateChange(new Date(e.target.value))
                  }
                  className="focus:ring-inset"
                />
              ) : null}
            </div>

            {expiresAt && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Link will expire {formatNaturalExpiration(expiresAt)} ( in{" "}
                  {expirationTime(expiresAt)})
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