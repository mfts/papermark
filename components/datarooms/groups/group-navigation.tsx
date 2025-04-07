import Link from "next/link";
import { useRouter } from "next/router";

import {
  ChartColumnIcon,
  CogIcon,
  FileSlidersIcon,
  LinkIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const GroupNavigation = ({
  dataroomId,
  viewerGroupId,
}: {
  dataroomId: string;
  viewerGroupId: string;
}) => {
  const router = useRouter();

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
      <Link
        href={`/datarooms/${dataroomId}/groups/${viewerGroupId}/links`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium": router.pathname.includes("links"),
          },
        )}
      >
        <LinkIcon className="h-4 w-4" />
        Links
      </Link>
      <Link
        href={`/datarooms/${dataroomId}/groups/${viewerGroupId}/group-analytics`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium": router.pathname.includes("group-analytics"),
          },
        )}
      >
        <ChartColumnIcon className="h-4 w-4" />
        Group analytics
      </Link>
    </nav>
  );
};
