import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";

export default function EmailProtectionSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { emailProtected } = data;
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(emailProtected);
  }, [emailProtected]);

  const handleEnableProtection = () => {
    const updatedEmailProtection = !enabled;
    setData({ ...data, emailProtected: updatedEmailProtection });
    setEnabled(updatedEmailProtection);
  };

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Require email to view
          </h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnableProtection} />
      </div>
    </div>
  );
}
