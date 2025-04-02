import { useEffect, useState } from "react";

import { motion } from "motion/react";

import { Input } from "@/components/ui/input";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function UploadSizeLimit({
  data,
  setData,
  title,
  tooltipContent,
  link,
  editLink,
}: {
  title: string;
  tooltipContent?: string;
  link?: string;
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

  const handleEnableFileSize = () => {
    setEnabled(!enabled);
  };

  return (
    <div className="pb-5">
      <div className="flex flex-col space-y-4">
        <LinkItem
          title="Upload Size Limit"
          enabled={enabled}
          action={handleEnableFileSize}
          tooltipContent="Set the maximum file size allowed for uploads. Default file size is 50MB. Max size 1024MB."
        />{" "}
        {enabled && (
          <motion.div
            className="relative mt-4 rounded-md shadow-sm"
            {...FADE_IN_ANIMATION_SETTINGS}
          >
            <Input
              name="fielSize"
              id="fielSize"
              autoComplete="off"
              data-1p-ignore
              type="number"
              min="1"
              max="1024"
              className="focus:ring-inset"
              // value={maxFileSize}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > 1024) return;
                // setData({ ...data, maxFileSize: value });
              }}
              aria-invalid="true"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
