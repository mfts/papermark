import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function AllowNotificationSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
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
      <LinkItem
        title="Receive email notification"
        link="https://www.papermark.com/help/article/link-settings"
        enabled={enabled}
        action={handleEnableNotification}
        tooltipContent="Get notified via email when someone views your content."
      />
    </div>
  );
}
