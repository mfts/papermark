import { useEffect, useState } from "react";

import { LinkPreset } from "@prisma/client";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function SecuredByPapermarkSection({
  data,
  setData,
  presets,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  presets: LinkPreset | null;
}) {
  const { securedByPapermark } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(securedByPapermark ?? false);
  }, [securedByPapermark]);

  useEffect(() => {
    if (presets?.securedByPapermark) {
      setEnabled(true);
      setData((prevData) => ({
        ...prevData,
        securedByPapermark: true,
      }));
    }
  }, [presets, setData]);

  const handleSecuredByPapermarkToggle = () => {
    const updatedSecuredByPapermark = !enabled;
    setData({ ...data, securedByPapermark: updatedSecuredByPapermark });
    setEnabled(updatedSecuredByPapermark);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Secured by Papermark"
        tooltipContent="Show a subtle footer with 'Secured by Papermark' branding in your dataroom"
        enabled={enabled}
        action={handleSecuredByPapermarkToggle}
        isAllowed={true}
      />
    </div>
  );
}
