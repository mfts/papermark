import Link from "next/link";
import { useRouter } from "next/router";

import { BellIcon, CogIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SettingsTabsProps {
  dataroomId: string;
}

export default function SettingsTabs({ dataroomId }: SettingsTabsProps) {
  const router = useRouter();

  return (
    <nav className="grid space-y-1 text-sm">
      <Link
        href={`/datarooms/${dataroomId}/settings`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium":
              router.pathname === `/datarooms/[id]/settings`,
          },
        )}
      >
        <CogIcon className="h-4 w-4" />
        General
      </Link>
      <Link
        href={`/datarooms/${dataroomId}/settings/notifications`}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted",
          {
            "bg-muted font-medium": router.pathname.includes("notifications"),
          },
        )}
      >
        <BellIcon className="h-4 w-4" />
        Notifications
      </Link>
    </nav>
  );
}
