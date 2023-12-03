import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";

export default function AllowNotificationSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { enableNotification } = data;
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(enableNotification);
  }, [enableNotification]);

  const handleEnableNotification = () => {
    const updatedEnableNotification = !enabled;
    setData({ ...data, enableNotification: updatedEnableNotification });
    setEnabled(updatedEnableNotification);
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
            Receive email notification
          </h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnableNotification} />
      </div>
    </div>
  );
}
