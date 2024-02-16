import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_LINK_TYPE } from ".";

const AddWatermarkSection = ({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
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
            )}
          >
            Add Watermark
          </h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnableWatermark} />
      </div>
    </section>
  );
};

export default AddWatermarkSection;
