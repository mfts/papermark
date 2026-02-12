import { useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  MailIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import useVisitorGroups, {
  VisitorGroupWithCount,
} from "@/lib/swr/use-visitor-groups";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { VisitorGroupModal } from "./visitor-group-modal";

export function VisitorGroupsSection() {
  const { visitorGroups, loading } = useVisitorGroups();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] =
    useState<VisitorGroupWithCount | null>(null);
  const teamInfo = useTeam();

  const handleEdit = (group: VisitorGroupWithCount) => {
    setEditingGroup(group);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  const handleDelete = async (group: VisitorGroupWithCount) => {
    if (
      !confirm(
        `Are you sure you want to delete "${group.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/visitor-groups/${group.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete visitor group.");
        return;
      }

      toast.success("Visitor group deleted successfully.");
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/visitor-groups`);
    } catch (error) {
      toast.error("Error deleting visitor group. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Visitor Groups
          </h3>
          <p className="text-sm text-muted-foreground">
            Create groups of emails and domains, then apply them to link allow
            lists.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !visitorGroups || visitorGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h4 className="mt-2 text-sm font-medium text-foreground">
            No visitor groups yet
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first visitor group to manage access across multiple
            links.
          </p>
          <Button
            onClick={handleCreate}
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            Create Group
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {visitorGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="truncate text-sm font-medium text-foreground">
                    {group.name}
                  </h4>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <MailIcon className="h-3 w-3" />
                    {group.emails.length}{" "}
                    {group.emails.length === 1 ? "entry" : "entries"}
                  </Badge>
                  {group._count.links > 0 && (
                    <Badge variant="outline" className="gap-1">
                      {group._count.links}{" "}
                      {group._count.links === 1 ? "link" : "links"}
                    </Badge>
                  )}
                  {group.emails.length > 0 && (
                    <span className="truncate text-xs text-muted-foreground">
                      {group.emails.slice(0, 3).join(", ")}
                      {group.emails.length > 3 &&
                        ` +${group.emails.length - 3} more`}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(group)}>
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(group)}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <VisitorGroupModal
        open={modalOpen}
        setOpen={setModalOpen}
        existingGroup={editingGroup}
      />
    </div>
  );
}
