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
    <div className="mx-auto !mt-4 flex w-full items-center gap-2">
      <Link href={`/datarooms/${dataroomId}/groups`}>
        <h2 className="text-md underline decoration-gray-500 underline-offset-4">
          All Groups
        </h2>
      </Link>
      <ChevronRightIcon className="h-4 w-4" />
      <h2 className="text-md font-medium text-primary">
        {groupName ?? "Management Team"}
      </h2>
    </div>
  );
};
