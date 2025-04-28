import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function IndexFileSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { enableIndexFile } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableIndexFile);
  }, [enableIndexFile]);

  const handleEnableIndexFile = () => {
    const updatedEnableIndexFile = !enabled;
    setData({ ...data, enableIndexFile: updatedEnableIndexFile });
    setEnabled(updatedEnableIndexFile);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Enable index file generation"
        enabled={enabled}
        link="https://www.papermark.com/help/article/link-settings"
        action={handleEnableIndexFile}
        tooltipContent="Allow visitors to generate an index file of all documents in the dataroom."
      />
    </div>
  );
}
