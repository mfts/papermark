import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { MoreHorizontalIcon, PlusCircleIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisitorAvatar } from "@/components/visitors/visitor-avatar";

import { useDataroomGroup } from "@/lib/swr/use-dataroom-groups";

import { AddGroupMemberModal } from "./add-member-modal";

export default function GroupMemberTable({
  dataroomId,
  groupId,
}: {
  dataroomId: string;
  groupId: string;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { viewerGroupMembers } = useDataroomGroup();

  const [addMembersOpen, setAddMembersOpen] = useState<boolean>(false);

  const handleRemoveMember = async (id: string) => {
    // mutate the data optimistically
    const key = `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}`;
    mutate(
      key,
      (currentData: { members: any[] } | undefined) => {
        if (!currentData) return currentData;
        console.log(currentData);
        return {
          ...currentData,
          viewerGroupMembers: currentData.members.filter(
            (member) => member.id !== id,
          ),
        };
      },
      false,
    );

    const response = await fetch(
      `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/members/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      mutate(key);
      toast.error("Failed to remove member");
      return;
    }
    mutate(key);
    toast.success("Member removed successfully");
  };

  return (
    <div className="l">
      <div className="mb-2 flex items-center justify-between md:mb-4">
        <h2>All members</h2>
        <Button
          size="sm"
          onClick={() => setAddMembersOpen(true)}
          className="h-8 gap-1"
        >
          <PlusCircleIcon className="h-4 w-4" />
          Add members
        </Button>
      </div>
      <AddGroupMemberModal
        dataroomId={dataroomId}
        groupId={groupId}
        open={addMembersOpen}
        setOpen={setAddMembersOpen}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Name</TableHead>
              {/* <TableHead>Visit Duration</TableHead> */}
              {/* <TableHead>Last Viewed Document</TableHead> */}
              {/* <TableHead>Last Viewed</TableHead> */}
              <TableHead className="text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewerGroupMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex h-40 w-full items-center justify-center">
                    <p>No Data Available</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {viewerGroupMembers ? (
              viewerGroupMembers.map((viewer) => (
                <TableRow key={viewer.id} className="group/row">
                  {/* Name */}
                  <TableCell className="">
                    <div className="flex items-center overflow-visible sm:space-x-3">
                      <VisitorAvatar viewerEmail={viewer.viewer.email} />
                      <div className="min-w-0 flex-1">
                        <div className="focus:outline-none">
                          <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                            {viewer.viewer.email}
                          </p>
                          <p className="text-xs text-muted-foreground/60 sm:text-sm">
                            {/* {view.link.name ? view.link.name : view.linkId} */}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {/* Last Viewed */}
                  {/* <TableCell className="text-sm text-muted-foreground">
                    <time
                      dateTime={new Date(viewer.viewer.updatedAt).toISOString()}
                    >
                      {viewer.viewer.updatedAt
                        ? timeAgo(viewer.viewer.updatedAt)
                        : "-"}
                    </time>
                  </TableCell> */}
                  {/* Actions */}
                  <TableCell className="p-0 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 group-hover/row:ring-1 group-hover/row:ring-gray-200 group-hover/row:dark:ring-gray-700"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-x-2 text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() => handleRemoveMember(viewer.id)}
                        >
                          <UserXIcon className="h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
