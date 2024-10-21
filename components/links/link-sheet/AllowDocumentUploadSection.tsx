import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function AllowDocumentUploadSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { allowDocUpload } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(allowDocUpload as boolean);
  }, [allowDocUpload]);

  const handleAllowDoUpload = () => {
    const updatedAllowDocUpload = !enabled;
    setData({ ...data, allowDocUpload: updatedAllowDocUpload });
    setEnabled(updatedAllowDocUpload);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Allow Document Upload"
        enabled={enabled}
        action={handleAllowDoUpload}
      />
    </div>
  );
}
