import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  CircleHelpIcon,
  MoreHorizontalIcon,
  Settings2Icon,
  Tag,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import AppLayout from "@/components/layouts/app";
import { randomBadgeColor } from "@/components/links/link-sheet/tag/tagBadge";
import { SearchBoxPersisted } from "@/components/search-box";
import { SettingsHeader } from "@/components/settings/settings-header";
import { AddTagsModal } from "@/components/tag/add-tag-Modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { useTags } from "@/lib/swr/use-tags";
import {
  TagColorProps,
  TagProps,
  TagsWithTotalCount,
  tagColors,
} from "@/lib/types";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .describe("The name of the tag to create."),
  description: z
    .string()
    .trim()
    .max(120)
    .optional()
    .describe("The description of the tag to create."),
  color: z.enum(tagColors, {
    required_error: "Please select a color for the tag",
  }),
});

const defaultValue = {
  name: "",
  description: "",
  color: randomBadgeColor(),
  loading: false,
};
export default function TagSetting() {
  const [open, setOpen] = useState(false);
  const teamInfo = useTeam();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const queryParams = router.query;
  const searchQuery = queryParams["search"];
  const teamId = teamInfo?.currentTeam?.id;
  const [tagForm, setTagForm] = useState<{
    color: TagColorProps;
    name: string;
    description: string | null;
    loading: boolean;
    id?: string;
  }>(defaultValue);

  useEffect(() => {
    if (open && !tagForm.id) {
      setTagForm((prev) => ({ ...prev, color: randomBadgeColor() }));
    }
  }, [open]);

  const {
    tagCount,
    tags: availableTags,
    loading: loadingTags,
    isValidating,
  } = useTags({
    query: {
      sortBy: "createdAt",
      sortOrder: "desc",
      page: currentPage,
      pageSize: 10,
      ...(searchQuery ? { search: String(searchQuery) } : {}),
    },
    includeLinksCount: true,
  });

  const handleDeleteTag = async (tagId: string) => {
    toast.promise(
      fetch(`/api/teams/${teamId}/tag/${tagId}`, {
        method: "DELETE",
      }).then(() => {
        mutate(
          `/api/teams/${teamId}/tag?${new URLSearchParams({
            sortBy: "createdAt",
            sortOrder: "desc",
            page: currentPage,
            pageSize: 10,
            ...(searchQuery ? { search: String(searchQuery) } : {}),
            includeLinksCount: true,
          } as Record<string, any>).toString()}`,
          null,
          {
            populateCache: (_, tags: TagsWithTotalCount | undefined) => {
              if (!tags) return { tags: [], totalCount: 0 };

              return {
                tags: tags.tags.filter((tag) => tag.id !== tagId),
                totalCount: tags.totalCount > 0 ? tags.totalCount - 1 : 0,
              };
            },
            revalidate: false,
          },
        );
      }),
      {
        loading: "Deleting tag...",
        success: "Tag deleted successfully!",
        error: "Failed to delete Tag. Try again.",
      },
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = schema.safeParse({
      name: tagForm.name,
      description: tagForm.description,
      color: tagForm.color,
    });

    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setTagForm((prev) => ({
      ...prev,
      loading: true,
    }));

    const url = tagForm.id
      ? `/api/teams/${teamId}/tag/${tagForm.id}`
      : `/api/teams/${teamId}/tag`;

    const method = tagForm.id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tagForm.name,
        color: tagForm.color,
        description: tagForm.description,
      }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      toast.error(error);
      setTagForm((prev) => ({
        ...prev,
        name: "",
        loading: false,
      }));
      return;
    }
    const newTag = await response.json();

    mutate(
      `/api/teams/${teamId}/tag?${new URLSearchParams({
        sortBy: "createdAt",
        sortOrder: "desc",
        page: currentPage,
        pageSize: 10,
        ...(searchQuery ? { search: String(searchQuery) } : {}),
        includeLinksCount: true,
      } as Record<string, any>).toString()}`,
      (tags: TagsWithTotalCount | undefined) => {
        if (!tags?.tags) return { tags: [newTag], totalCount: 1 };

        const updatedTags: TagProps[] = tagForm.id
          ? tags.tags.map((tag: TagProps) =>
              tag.id === tagForm.id ? newTag : tag,
            )
          : [newTag, ...tags.tags];

        return {
          tags: updatedTags,
          totalCount: tagForm.id ? tags.totalCount : tags.totalCount + 1,
        };
      },
      {
        revalidate: false,
      },
    );
    setOpen(false);
    toast.success(
      tagForm.id ? "Tag updated successfully!" : "Tag created successfully!",
    );
  };

  const setMenuOpen = (open: boolean) => {
    setOpen(open);
    setTagForm(defaultValue);
  };

  return (
    <AppLayout>
      <main className="mx-2 mb-10 mt-4 space-y-8 px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold">Tags</h3>

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              Manage and categorize your tags here.
            </p>
          </div>
          <div className="my-4 flex items-center justify-between">
            <SearchBoxPersisted loading={isValidating} inputClassName="h-10" />
            <AddTagsModal
              open={open}
              setMenuOpen={setMenuOpen}
              tagForm={tagForm}
              setTagForm={setTagForm}
              handleSubmit={handleSubmit}
              tagCount={tagCount}
            >
              <Button>Create Tag</Button>
            </AddTagsModal>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
                  <TableHead>Tag Name</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-center sm:text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagCount === 0 && !loadingTags && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex h-40 w-full items-center justify-center">
                        <p>No Tags Available</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {availableTags && !loadingTags ? (
                  availableTags.map((tag) => {
                    return (
                      <>
                        <TableRow key={tag.id} className="group/row">
                          {/* Name */}
                          <TableCell>
                            <div className="flex items-center overflow-visible sm:space-x-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Tag
                                    size={24}
                                    className={`rounded-sm border border-gray-200 dark:text-primary-foreground bg-${tag.color}-100 p-1`}
                                  />
                                  <p>{tag.name}</p>
                                  {!!tag.description && (
                                    <BadgeTooltip
                                      content={tag.description}
                                      key="tag_tooltip"
                                    >
                                      <CircleHelpIcon className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground" />
                                    </BadgeTooltip>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {/* Link Count */}
                          <TableCell className="text-center text-sm text-muted-foreground sm:text-right">
                            <Button variant="outline" size="sm">
                              {tag._count?.taggedItems || 0} links
                            </Button>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-center sm:text-right">
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTagForm({
                                      color: tag.color,
                                      name: tag.name,
                                      description: tag.description,
                                      id: tag.id,
                                      loading: false,
                                    });
                                    setOpen(true);
                                  }}
                                >
                                  <Settings2Icon className="mr-2 h-4 w-4" />
                                  Edit tag
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive transition-colors duration-200 focus:bg-destructive focus:text-destructive-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTag(tag.id);
                                  }}
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  Delete tag
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="min-w-[100px]">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                    <TableCell className="min-w-[450px]">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="mt-2 flex w-full items-center">
            <div className="w-full text-sm">
              {!loadingTags ? (
                <>
                  Showing{" "}
                  <strong className="font-semibold">
                    {tagCount && tagCount > 10
                      ? availableTags?.length
                      : tagCount}
                  </strong>{" "}
                  of <strong>{tagCount}</strong> tags
                </>
              ) : (
                "Getting Data from the server..."
              )}
            </div>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                  />
                </PaginationItem>
                {currentPage !== 1 ? (
                  <PaginationItem className="cursor-pointer">
                    <PaginationLink onClick={() => setCurrentPage(1)}>
                      {1}
                    </PaginationLink>
                  </PaginationItem>
                ) : null}

                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                {tagCount && currentPage !== Math.ceil(tagCount / 10) ? (
                  <PaginationItem>
                    <PaginationLink
                      className="cursor-pointer"
                      onClick={() => setCurrentPage(Math.ceil(tagCount / 10))}
                    >
                      {Math.ceil(tagCount / 10)}
                    </PaginationLink>
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationNext
                    className="cursor-pointer"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      tagCount ? currentPage === Math.ceil(tagCount / 10) : true
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
