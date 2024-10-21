import Link from "next/link";

import { BoxesIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import useDataroomGroups from "@/lib/swr/use-dataroom-groups";
import { cn } from "@/lib/utils";

import LoadingSpinner from "../ui/loading-spinner";

export function GroupNavigation({
  open,
  setOpen,
  dataroomId,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
  children?: React.ReactNode;
}) {
  const { viewerGroups, loading } = useDataroomGroups();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Set Permission</DialogTitle>
          <DialogDescription>
            Move to group for set permission
          </DialogDescription>
        </DialogHeader>
        <div>
          {loading ? <LoadingSpinner className="mr-1 h-5 w-5" /> : null}
          <div className="flex max-h-[260px] flex-col overflow-auto">
            {viewerGroups &&
              viewerGroups.map((g) => {
                return (
                  <Link
                    href={`/datarooms/${dataroomId}/groups/${g.id}/permissions`}
                    key={g.id}
                    className="inline-flex w-full cursor-pointer items-center rounded-md px-3 py-1.5 font-semibold leading-6 text-foreground duration-100 hover:bg-gray-100 hover:dark:bg-muted"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="hidden rounded-full border border-gray-200 sm:block">
                        <div
                          className={cn(
                            "rounded-full border border-white bg-gradient-to-t from-gray-100 p-1 md:p-3",
                          )}
                        >
                          <BoxesIcon className="size-3" />
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {g.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {g._count.members} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
