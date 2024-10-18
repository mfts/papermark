import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import useArchiveDataroom from "@/lib/swr/use-archive-dataroom";

export default function ArchiveDataroom({
  dataroomId,
  teamId,
}: {
  dataroomId: string;
  teamId?: string;
}) {
  const { isArchived, toggleArchive, isLoading, isUpdating } =
    useArchiveDataroom(dataroomId, teamId);

  return (
    <div className="rounded-lg">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>
            {isLoading ? (
              <Skeleton className="h-8 w-1/3" />
            ) : isArchived ? (
              "Unarchive Dataroom"
            ) : (
              "Archive Dataroom"
            )}
          </CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-2/3" />
            ) : isArchived ? (
              "Unarchive this dataroom and re-enable all its links."
            ) : (
              "Archive this dataroom and disable all its links."
            )}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <Button
              variant={isArchived ? "default" : "destructive"}
              onClick={toggleArchive}
              disabled={isUpdating}
            >
              {isUpdating
                ? isArchived
                  ? "Unarchiving..."
                  : "Archiving..."
                : isArchived
                  ? "Unarchive Dataroom"
                  : "Archive Dataroom"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
