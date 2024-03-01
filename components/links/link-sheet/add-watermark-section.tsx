import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_LINK_TYPE } from ".";

const AddWatermarkSection = ({
  data,
  setData,
  hasFreePlan,
  setOpenUpgradeModal,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  hasFreePlan: boolean;
  setOpenUpgradeModal: Dispatch<SetStateAction<boolean>>;
}) => {
  const { watermark } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(watermark);
  }, [watermark]);

  const handleEnableWatermark = () => {
    setData({
      ...data,
      watermark: !enabled,
      emailProtected: !enabled ? true : data.emailProtected,
    });
    setEnabled(!enabled);
  };

  return (
    <section className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
              hasFreePlan && "cursor-pointer",
            )}
            onClick={hasFreePlan ? () => setOpenUpgradeModal(true) : undefined}
          >
            Add Watermark
            {hasFreePlan && (
              <span className="bg-background text-foreground ring-1 ring-gray-800 dark:ring-gray-500 rounded-full px-2 py-0.5 text-xs ml-2">
                Pro
              </span>
            )}
          </h2>
        </div>
        <Switch
          checked={enabled}
          onClick={hasFreePlan ? () => setOpenUpgradeModal(true) : undefined}
          className={hasFreePlan ? "opacity-50" : undefined}
          onCheckedChange={hasFreePlan ? undefined : handleEnableWatermark}
        />
      </div>
    </section>
  );
};

export default AddWatermarkSection;
