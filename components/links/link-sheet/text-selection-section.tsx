import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function TextSelectionSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { enableTextSelection } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableTextSelection);
  }, [enableTextSelection]);

  const handleEnableTextSelection = () => {
    const updatedEnableTextSelection = !enabled;
    setData({
      ...data,
      enableTextSelection: updatedEnableTextSelection,
    });
    setEnabled(updatedEnableTextSelection);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Allow text selection"
        tooltipContent="Allow visitors to select and copy text on Notion pages."
        enabled={enabled}
        action={handleEnableTextSelection}
      />
    </div>
  );
}
