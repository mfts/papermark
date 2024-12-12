import { useEffect, useState } from "react";

import { motion } from "motion/react";

import { Input } from "@/components/ui/input";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { getDateTimeLocal } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function ExpirationSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { expiresAt } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(!!expiresAt);
  }, [expiresAt]);

  const handleEnableExpiration = () => {
    if (enabled) {
      // if expiration is currently set and we're toggling it off
      setData({ ...data, expiresAt: null });
    }
    setEnabled(!enabled);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Expiration Date"
        enabled={enabled}
        link="https://www.papermark.io/help/article/expiration-date"
        action={handleEnableExpiration}
        tooltipContent="Set a date after which the link will no longer be accessible."
      />

      {enabled && (
        <motion.div className="mt-3" {...FADE_IN_ANIMATION_SETTINGS}>
          <Input
            type="datetime-local"
            id="expiresAt"
            name="expiresAt"
            min={getDateTimeLocal()}
            value={expiresAt ? getDateTimeLocal(expiresAt) : ""}
            step="60" // need to add step to prevent weird date bug (https://stackoverflow.com/q/19284193/10639526)
            onChange={(e) => {
              setData({ ...data, expiresAt: new Date(e.target.value) });
            }}
            className="focus:ring-inset"
          />
        </motion.div>
      )}
    </div>
  );
}
