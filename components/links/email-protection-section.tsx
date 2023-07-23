import { Dispatch, SetStateAction, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from "./link-sheet";



export default function EmailProtectionSection({data, setData}: {data: DEFAULT_LINK_TYPE, setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>}) {
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
          onCheckedChange={() => handleCheckedChange()}
        />
      </div>
    </div>
  );
}