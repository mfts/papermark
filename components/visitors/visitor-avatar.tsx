import { ArchiveIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { generateGravatarHash } from "@/lib/utils";
import { cn } from "@/lib/utils";

import { BadgeTooltip } from "../ui/tooltip";

export const VisitorAvatar = ({
  viewerEmail,
  isArchived,
  className,
}: {
  viewerEmail: string | null;
  isArchived?: boolean;
  className?: string;
}) => {
  // Convert email string to a simple hash
  const hashString = (str: string) => {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  // Get the background color from the email number hash
  const getColorFromHash = (hash: number): string => {
    // An array of colors you want to choose from
    const colors = [
      "to-gray-200/50",
      "to-gray-300/50",
      "to-gray-400/50",
      "to-gray-500/50",
      "to-gray-600/50",
    ];

    // Use the hash to get an index for the colors array
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (isArchived) {
    return (
      <BadgeTooltip
        key="archived"
        content="Visit is archived and excluded from the document statistics"
      >
        <Avatar
          className={cn("hidden flex-shrink-0 sm:inline-flex", className)}
        >
          <AvatarFallback className="bg-gray-200/50 dark:bg-gray-200/50">
            <ArchiveIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </BadgeTooltip>
    );
  }
  if (!viewerEmail) {
    return (
      <Avatar className={cn("hidden flex-shrink-0 sm:inline-flex", className)}>
        <AvatarFallback className="bg-gray-200/50 dark:bg-gray-200/50">
          AN
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar
      className={cn(
        "hidden flex-shrink-0 border border-gray-200 dark:border-gray-800 sm:inline-flex",
        className,
      )}
    >
      <AvatarImage
        src={`https://gravatar.com/avatar/${generateGravatarHash(
          viewerEmail,
        )}?s=80&d=404`}
      />

      <AvatarFallback
        className={`${getColorFromHash(
          hashString(viewerEmail),
        )} dark:${getColorFromHash(hashString(viewerEmail))} border border-white bg-gradient-to-t from-gray-100 p-1 dark:border-gray-900 dark:from-gray-900`}
      >
        {viewerEmail?.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
