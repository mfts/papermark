import Link from "next/link";
import { useRouter } from "next/router";

import { CogIcon, FileSlidersIcon, UsersIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const GroupNavigation = ({
  dataroomId,
  viewerGroupId,
}: {
  dataroomId: string;
  viewerGroupId: string;
}) => {
  const router = useRouter();
  console.log(router.pathname);

  return (
    <nav className="grid space-y-1 text-sm">
      <Link
        href={`/datarooms/${dataroomId}/groups/${viewerGroupId}`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium":
              router.pathname === `/datarooms/[id]/groups/[groupId]`,
          },
        )}
      >
        <CogIcon className="h-4 w-4" />
        General
      </Link>
      <Link
        href={`/datarooms/${dataroomId}/groups/${viewerGroupId}/members`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium": router.pathname.includes("members"),
          },
        )}
      >
        <UsersIcon className="h-4 w-4" />
        Members
      </Link>
      <Link
        href={`/datarooms/${dataroomId}/groups/${viewerGroupId}/permissions`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium": router.pathname.includes("permissions"),
          },
        )}
      >
        <FileSlidersIcon className="h-4 w-4" />
        Permissions
      </Link>
    </nav>
  );
};
