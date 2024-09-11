import Link from "next/link";

import { ChevronRightIcon } from "lucide-react";

export const GroupHeader = ({
  dataroomId,
  groupName,
}: {
  dataroomId: string;
  groupName: string;
}) => {
  return (
    <div className="mx-auto flex w-full items-center gap-2">
      <Link href={`/datarooms/${dataroomId}/groups`}>
        <h2 className="text-lg">All Groups</h2>
      </Link>
      <ChevronRightIcon className="h-4 w-4" />
      <h2 className="text-lg font-semibold text-primary">
        {groupName ?? "Management Team"}
      </h2>
    </div>
  );
};
