import { useEffect, useState } from "react";



import { PRESET_DATA } from "@/pages/settings/presets/[id]";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

const PRESET_OPTIONS = [
  { label: "in 1 hour", value: 3600 },
  { label: "in 6 hours", value: 21600 },
  { label: "in 12 hours", value: 43200 },
  { label: "in 1 day", value: 86400 },
  { label: "in 3 days", value: 259200 },
  { label: "in 7 days", value: 604800 },
  { label: "in 14 days", value: 1209600 },
  { label: "in 1 month", value: 2592000 },
  { label: "in 3 months", value: 7776000 },
  { label: "in 6 months", value: 15552000 },
  { label: "in 1 year", value: 31536000 },
];

export const formatExpirationTime = (seconds: number) => {
  if (seconds < 60) {
    return "Less than a minute";
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (seconds < 2592000) {
    // Less than a month
    const days = Math.floor(seconds / 86400);
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (seconds < 31536000) {
    // Less than a year
    const months = Math.floor(seconds / 2592000);
    return `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(seconds / 31536000);
    return `${years} year${years > 1 ? "s" : ""}`;
  }
};

export default function ExpirationInSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE & { expiresIn?: number | null };
  setData: React.Dispatch<
    React.SetStateAction<DEFAULT_LINK_TYPE & { expiresIn?: number | null }>
  >;
}) {
  console.log("data data", data);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(!!data.expiresIn);

    if (data.expiresIn) {
      const matchingPreset = PRESET_OPTIONS.find(
        (option) => option.value === data.expiresIn,
      );

      if (matchingPreset) {
        setSelectedPreset(matchingPreset.value.toString());
      } else {
        setSelectedPreset("");
      }
    }
  }, [data.expiresIn]);

  const handleEnableExpiration = () => {
    if (enabled) {
      setSelectedPreset("");
      setError(null);
    } else {
      setData({
        ...data,
        expiresIn: 604800,
        expiresAt: null,
      });
      setSelectedPreset("604800");
      setError(null);
    }
    setEnabled(!enabled);
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    setError(null);

    const seconds = parseInt(value);
    if (!isNaN(seconds)) {
      setData({
        ...data,
        expiresIn: seconds,
      });
    }
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Link Expires After"
        enabled={enabled}
        link="https://www.papermark.com/help/article/expiration-date"
        action={handleEnableExpiration}
        tooltipContent="Set how long the link will remain active."
      />

      {enabled && (
        <motion.div className="mt-3 space-y-3" {...FADE_IN_ANIMATION_SETTINGS}>
          <div className="flex flex-col space-y-2">
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
                  Links will expire in {formatExpirationTime(data.expiresIn)}
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
