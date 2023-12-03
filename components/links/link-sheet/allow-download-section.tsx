import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";

export default function AllowDownloadSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { allowDownload } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(allowDownload);
  }, [allowDownload]);

  const handleAllowDownload = () => {
    const updatedAllowDownload = !enabled;
    setData({ ...data, allowDownload: updatedAllowDownload });
    setEnabled(updatedAllowDownload);
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
            Allow downloading
          </h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleAllowDownload} />
      </div>
    </div>
  );
}
