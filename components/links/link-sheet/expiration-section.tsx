import { useEffect, useState } from "react";

import { motion } from "framer-motion";

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
        action={handleEnableExpiration}
      />

      {enabled && (
        <motion.div className="mt-3" {...FADE_IN_ANIMATION_SETTINGS}>
          <input
            type="datetime-local"
            id="expiresAt"
            name="expiresAt"
            min={getDateTimeLocal()}
            value={expiresAt ? getDateTimeLocal(expiresAt) : ""}
            step="60" // need to add step to prevent weird date bug (https://stackoverflow.com/q/19284193/10639526)
            onChange={(e) => {
              setData({ ...data, expiresAt: new Date(e.target.value) });
            }}
            className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
          />
        </motion.div>
      )}
    </div>
  );
}
