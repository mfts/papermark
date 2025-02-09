import { NavMenu } from "../navigation-menu";

export const DataroomNavigation = ({ dataroomId }: { dataroomId?: string }) => {
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
