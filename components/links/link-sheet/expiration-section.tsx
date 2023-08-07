import { Dispatch, SetStateAction, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/contants";
import { cn, getDateTimeLocal } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";



export default function ExpirationSection({data, setData}: {data: DEFAULT_LINK_TYPE, setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>}) {
  const { expiresAt } = data;
  const [enabled, setEnabled] = useState(!!expiresAt);

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "text-sm font-medium leading-6",
              enabled ? "text-white" : "text-gray-400"
            )}
          >
            Expiration Date
          </h2>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={() => setEnabled(!enabled)}
        />
      </div>
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
            className="flex w-full rounded-md border-0 py-1.5 text-white bg-black shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:[color-scheme:dark]"
          />
        </motion.div>
      )}
    </div>
  );
}