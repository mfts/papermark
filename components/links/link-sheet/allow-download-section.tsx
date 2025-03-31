import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function AllowDownloadSection({
  data,
  isAllowed,
  setData,
}: {
  isAllowed?: boolean;
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
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
      <LinkItem
        switcherTooltipContent='"Notion" files cannot be downloaded.'
        isAllowed={isAllowed}
        title="Allow downloading"
        enabled={enabled}
        link="https://www.papermark.com/help/article/link-settings"
        action={handleAllowDownload}
        tooltipContent="Allow visitors to download the content."
      />
    </div>
  );
}
