import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

export default function FeedbackSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { enableFeedback } = data;
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(enableFeedback);
  }, [enableFeedback]);

  const handleEnableFeedback = () => {
    const updatedEnableFeedback = !enabled;
    setData({ ...data, enableFeedback: updatedEnableFeedback });
    setEnabled(updatedEnableFeedback);
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
            Receive feedback from visitors
          </h2>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnableFeedback} />
      </div>
    </div>
  );
}
