import { useEffect, useState } from "react";



import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { WITH_CUSTOM_PRESET_OPTION, getDateTimeLocal } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function ExpirationSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE & { expiresIn?: number | null };
  setData: React.Dispatch<
    React.SetStateAction<DEFAULT_LINK_TYPE & { expiresIn?: number | null }>
  >;
}) {
  const { expiresAt } = data;
  console.log("expiresAt", expiresAt);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Initialize state based on existing expiration
  useEffect(() => {
    setEnabled(!!expiresAt);

    if (expiresAt) {
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
      }
    }
  }, [expiresAt]);

  const handleEnableExpiration = () => {
    if (enabled) {
      setData({ ...data, expiresAt: null });
      setSelectedPreset("");
      setError(null);
    } else {
      const defaultExpiresAt = new Date();
      defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 7);
      setData({ ...data, expiresAt: defaultExpiresAt, expiresIn: null });
      setSelectedPreset("604800");
      setError(null);
    }
    setEnabled(!enabled);
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
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const now = new Date();

    // Check if the selected date is in the past
    if (selectedDate <= now) {
      setError("Expiration time must be in the future");
      return;
    }

    setData({ ...data, expiresAt: selectedDate });
    setSelectedPreset("custom");
    setError(null);
  };

  const formatExpirationTime = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const diffInSeconds = Math.floor(
      (dateObj.getTime() - now.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return "Less than a minute";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      const remainingHours = Math.floor((diffInSeconds % 86400) / 3600);

      if (remainingHours === 0) {
        return `${days} day${days > 1 ? "s" : ""}`;
      } else {
        return `${days} day${days > 1 ? "s" : ""} and ${remainingHours} hour${remainingHours > 1 ? "s" : ""}`;
      }
    }
  };

  const formatNaturalExpiration = (date: Date | string) => {
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
  };

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
          <div className="flex flex-col space-y-2">
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiration time" />
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

            {expiresAt && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Link will expire {formatNaturalExpiration(expiresAt)} ( in{" "}
                  {formatExpirationTime(expiresAt)})
                </div>
              </div>
            )}

            {error && <div className="text-xs text-red-500">{error}</div>}
          </div>

          {(selectedPreset === "custom" || !selectedPreset) && (
            <Input
              type="datetime-local"
              id="expiresAt"
              name="expiresAt"
              min={getDateTimeLocal()}
              value={expiresAt ? getDateTimeLocal(expiresAt) : ""}
              step="60" // need to add step to prevent weird date bug (https://stackoverflow.com/q/19284193/10639526)
              onChange={handleCustomDateChange}
              className="focus:ring-inset"
            />
          )}
        </motion.div>
      )}
    </div>
  );
}