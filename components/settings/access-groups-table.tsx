import { useRouter } from "next/router";



import { useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  ChevronDown,
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { fetcher, nFormatter, timeAgo } from "@/lib/utils";

import { Pagination } from "@/components/documents/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

// Generic type for access groups
type AccessGroup = {
  id: string;
  name: string;
  type: "ALLOW" | "BLOCK";
  emailList: string[];
  _count?: {
    allowLinks: number;
    blockLinks: number;
  };
  createdAt: string;
  updatedAt: string;
};

type AccessGroupsResponse = {
  groups: AccessGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type AccessGroupLink = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    name: string;
  };
  dataroom?: {
    id: string;
    name: string;
  };
  _count: {
    views: number;
  };
};

type AccessGroupsTableProps = {
  type: "allow" | "block";
  isAllowed: boolean;
  onUpgrade: () => void;
};

export default function AccessGroupsTable({
  type,
  isAllowed,
  onUpgrade,
}: AccessGroupsTableProps) {
  const router = useRouter();
  const teamInfo = useTeam();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGroupForDeletion, setSelectedGroupForDeletion] =
    useState<AccessGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const {
    data: accessGroupsResponse,
    isLoading,
    mutate,
  } = useSWR<AccessGroupsResponse>(
    teamInfo?.currentTeam?.id && isAllowed
      ? `/api/teams/${teamInfo.currentTeam.id}/access-groups?type=${type.toUpperCase()}&page=${currentPage}&limit=${pageSize}`
      : null,
    fetcher,
  );

  const accessGroups = accessGroupsResponse?.groups || [];
  const pagination = accessGroupsResponse?.pagination;

  const handleDeleteClick = (group: AccessGroup) => {
    setSelectedGroupForDeletion(group);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!teamInfo?.currentTeam?.id || !selectedGroupForDeletion) return;

    setDeletingGroupId(selectedGroupForDeletion.id);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/access-groups/${selectedGroupForDeletion.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete ${type} list group`,
        );
      }

      toast.success(
        `${type === "allow" ? "Allow" : "Block"} list group deleted successfully`,
      );
      mutate();
      setShowDeleteDialog(false);
      setSelectedGroupForDeletion(null);
    } catch (error: any) {
      toast.error(error.message || `Failed to delete ${type} list group`);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const getListProperty = (group: AccessGroup) => {
    return group.emailList;
  };

  const getLinkCount = (group: AccessGroup) => {
    return (group._count?.allowLinks || 0) + (group._count?.blockLinks || 0);
  };

  const getDisplayText = () => {
    return {
      title: type === "allow" ? "Allow List Groups" : "Block List Groups",
      createButton: `Create ${type === "allow" ? "Allow" : "Block"} List Group`,
      emptyTitle: `No ${type} list groups`,
      emptyDescription: `Create your first ${type} list group to get started.`,
      editRoute: `access-groups`,
      listLabel:
        type === "allow"
          ? "Email addresses/domains:"
          : "Blocked emails/domains:",
      deleteDialogTitle: `delete the ${type} list group`,
      warningText: `This group is currently used by`,
    };
  };

  const displayText = getDisplayText();

  // Component to display links for a specific group
  const GroupLinksSection = ({ group }: { group: AccessGroup }) => {
    const { data: links, isLoading: linksLoading } = useSWR<AccessGroupLink[]>(
      teamInfo?.currentTeam?.id && expandedGroups.has(group.id)
        ? `/api/teams/${teamInfo.currentTeam.id}/access-groups/${group.id}/links`
        : null,
      fetcher,
    );

    const linkCount = getLinkCount(group);

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedGroups);
      if (newExpanded.has(group.id)) {
        newExpanded.delete(group.id);
      } else {
        newExpanded.add(group.id);
      }
      setExpandedGroups(newExpanded);
    };

    if (linkCount === 0) {
      return (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Used in links:</span>
          <Badge variant="outline">0 links</Badge>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center justify-between text-sm transition-opacity hover:opacity-70"
        >
          <span className="text-muted-foreground">Used in links:</span>
          <div className="flex items-center space-x-1">
            <Badge variant="outline">{linkCount} links</Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                expandedGroups.has(group.id) ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {expandedGroups.has(group.id) && (
          <div className="border-l-2 border-gray-200 pl-3 dark:border-gray-700">
            {linksLoading ? (
              <div className="space-y-1">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center space-x-3 rounded-md bg-gray-50 p-2 dark:bg-gray-800/50"
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-muted-foreground dark:bg-gray-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {link.name || "Untitled"}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {link.dataroom ? "Dataroom" : "Document"}:{" "}
                        {link.dataroom?.name || link.document?.name}
                      </div>
                    </div>
                    <div className="flex-shrink-0 pr-4 text-xs text-muted-foreground">
                      {nFormatter(link._count.views)} views
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No links found
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isAllowed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayText.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {type === "allow"
                ? "Manage viewer access with reusable allow lists"
                : "Block specific users with reusable block lists"}
            </p>
            <div className="mt-6">
              <Button onClick={onUpgrade}>Upgrade to create groups</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accessGroups && accessGroups.length > 0 ? (
          <div className="space-y-4">
            {accessGroups.map((group) => {
              const groupList = getListProperty(group) || [];
              return (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/settings/${displayText.editRoute}/${group.id}`,
                              )
                            }
                          >
                            <PenIcon className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(group)}
                            className="text-red-600 focus:text-red-600"
                            disabled={deletingGroupId === group.id}
                          >
                            {deletingGroupId === group.id ? (
                              "Deleting..."
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {displayText.listLabel}
                        </span>
                        <Badge variant="secondary">
                          {groupList.length} entries
                        </Badge>
                      </div>
                      {groupList.length > 0 && (
                        <div className="rounded-md bg-muted p-3">
                          <div className="max-h-20 overflow-y-auto text-sm">
                            {groupList.slice(0, 5).map((item, i) => (
                              <div key={i} className="font-mono">
                                {item}
                              </div>
                            ))}
                            {groupList.length > 5 && (
                              <div className="text-muted-foreground">
                                + {groupList.length - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <GroupLinksSection group={group} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {displayText.emptyTitle}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {displayText.emptyDescription}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      router.push(
                        `/settings/${displayText.editRoute}/new?type=${type.toUpperCase()}`,
                      )
                    }
                  >
                    <PlusIcon className="mr-1.5 h-4 w-4" />
                    {displayText.createButton}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setCurrentPage(1);
          }}
          totalShownItems={Math.min(
            pagination.limit,
            pagination.total - (pagination.page - 1) * pagination.limit,
          )}
          itemName={`${type} list groups`}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently {displayText.deleteDialogTitle} &quot;
              {selectedGroupForDeletion?.name}&quot;. This action cannot be
              undone.
              {selectedGroupForDeletion &&
              getLinkCount(selectedGroupForDeletion) > 0 ? (
                <>
                  <br />
                  <br />
                  <span className="font-medium text-orange-600">
                    Note: {displayText.warningText}{" "}
                    {getLinkCount(selectedGroupForDeletion)} link
                    {getLinkCount(selectedGroupForDeletion) > 1 ? "s" : ""}.
                    Deleting this group will automatically remove it from all
                    these links.
                  </span>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingGroupId === selectedGroupForDeletion?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingGroupId === selectedGroupForDeletion?.id
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
