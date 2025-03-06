import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function FeedbackSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
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
      <LinkItem
        title="Enable feedback from visitors"
        enabled={enabled}
        tooltipContent="Allow viewers to provide feedback on your content."
        action={handleEnableFeedback}
      />
    </div>
  );
}
