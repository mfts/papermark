import { useEffect, useState } from "react";



import { PRESET_DATA } from "@/pages/settings/presets/[id]";
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

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function ExpirationInSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE & { expiresIn?: number | null };
  setData: React.Dispatch<
    React.SetStateAction<DEFAULT_LINK_TYPE & { expiresIn?: number | null }>
  >;
}) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(!!data.expiresIn);

    if (data.expiresIn) {
      const matchingPreset = PRESET_OPTIONS.find(
        (option: { value: number }) => option.value === data.expiresIn,
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
                {PRESET_OPTIONS.map(
                  (option: { value: number; label: string }) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ),
                )}
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
