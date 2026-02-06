import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function AllowDownloadSection({
  data,
  setData,
  isNotionDocument = false,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isNotionDocument?: boolean;
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

  // Hide download option for Notion documents since downloading is not supported
  if (isNotionDocument) {
    return null;
  }

  return (
    <div className="pb-5">
      <LinkItem
        title="Allow downloading"
        enabled={enabled}
        link="https://www.papermark.com/help/article/link-settings"
        action={handleAllowDownload}
        tooltipContent="Allow visitors to download the content."
      />
    </div>
  );
}
