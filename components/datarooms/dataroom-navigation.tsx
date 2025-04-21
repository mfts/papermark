import useLimits from "@/lib/swr/use-limits";

import { NavMenu } from "../navigation-menu";

export const DataroomNavigation = ({ dataroomId }: { dataroomId?: string }) => {
  const { limits } = useLimits();
  if (!dataroomId) {
    return null;
  }
  return (
    <NavMenu
      navigation={[
        {
          label: "Data Room",
          href: `/datarooms/${dataroomId}/documents`,
          segment: "documents",
        },
        {
          label: "Permissions",
          href: `/datarooms/${dataroomId}/permissions`,
          segment: "permissions",
        },
        {
          label: "Analytics",
          href: `/datarooms/${dataroomId}/analytics`,
          segment: "analytics",
        },
        {
          label: "Q&A Conversations",
          href: `/datarooms/${dataroomId}/conversations`,
          segment: "conversations",
          disabled: !limits?.conversationsInDataroom,
        },
        {
          label: "Branding",
          href: `/datarooms/${dataroomId}/branding`,
          segment: "branding",
        },
        {
          label: "Settings",
          href: `/datarooms/${dataroomId}/settings`,
          segment: "settings",
        },
      ]}
    />
  );
};
