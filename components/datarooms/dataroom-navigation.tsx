import { NavMenu } from "../navigation-menu";

export const DataroomNavigation = ({ dataroomId }: { dataroomId?: string }) => {
  if (!dataroomId) {
    return null;
  }
  return (
    <NavMenu
      navigation={[
        {
          label: "Overview",
          href: `/datarooms/${dataroomId}`,
          segment: `/datarooms/[id]`,
        },
        {
          label: "Documents",
          href: `/datarooms/${dataroomId}/documents`,
          segment: "documents",
        },
        {
          label: "Groups",
          href: `/datarooms/${dataroomId}/groups`,
          segment: "groups",
        },
        {
          label: "Users",
          href: `/datarooms/${dataroomId}/users`,
          segment: "users",
        },
        {
          label: "Customization",
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
