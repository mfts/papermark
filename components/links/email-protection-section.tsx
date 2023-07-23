import { Dispatch, SetStateAction, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Link } from "@prisma/client";
import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/contants";
import { cn, getDateTimeLocal } from "@/lib/utils";



export default function EmailProtectionSection({data, setData}: {data: Link, setData: Dispatch<SetStateAction<Link>>}) {
  const [enabled, setEnabled] = useState(true);

  function handleCheckedChange() {
    setData({ ...data, emailProtected: enabled });
    setEnabled(!enabled);
  }
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
            Email Protection
          </h2>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(e) => handleCheckedChange()}
        />
      </div>
    </div>
  );
}