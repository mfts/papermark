import { useEffect, useState } from "react";

import { motion } from "motion/react";

import { Input } from "@/components/ui/input";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function MaxFileLimit({
  data,
  setData,
  editLink,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  editLink?: boolean;
}) {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (editLink) {
      setEnabled(true);
    }
  }, [editLink]);

  const handleEnableMaxFiles = () => {
    setEnabled(!enabled);
    setData({ ...data, maxFiles: !enabled ? data.maxFiles : 1 });
  };

  return (
    <div className="pb-5">
      <div className="flex flex-col space-y-4">
        <LinkItem
          title="Maximum Files"
          enabled={enabled}
          action={handleEnableMaxFiles}
          tooltipContent="Set the maximum number of files that can be uploaded. Default is 1 file."
        />
        {enabled && (
          <motion.div
            className="relative mt-4 rounded-md shadow-sm"
            {...FADE_IN_ANIMATION_SETTINGS}
          >
            <Input
              name="maxFiles"
              id="maxFiles"
              autoComplete="off"
              data-1p-ignore
              type="number"
              min="1"
              max="100"
              className="focus:ring-inset"
              value={data.maxFiles}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > 100) return;
                setData({ ...data, maxFiles: value });
              }}
              aria-invalid="true"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
