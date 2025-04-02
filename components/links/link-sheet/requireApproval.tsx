import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function RequireApproval({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { requireApproval } = data;
  const [enabled, setEnabled] = useState<boolean>(!!requireApproval);

  useEffect(() => {
    setEnabled(!!requireApproval);
  }, [requireApproval]);

  const handleDisableApproval = () => {
    const updatedEnableApproval = !enabled;
    setData({ ...data, requireApproval: updatedEnableApproval });
    setEnabled(updatedEnableApproval);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Require Approval"
        enabled={enabled}
        action={handleDisableApproval}
        tooltipContent="Enable this option to approve or reject uploaded files before they are added to the document or dataroom."
      />
    </div>
  );
}
