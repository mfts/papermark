"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ItemType, ViewerGroupAccessControls } from "@prisma/client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownToLineIcon,
  ChevronDown,
  ChevronRight,
  EyeIcon,
  EyeOffIcon,
  File,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { useDataroomFoldersTree } from "@/lib/swr/use-dataroom";
import { cn } from "@/lib/utils";
import {
  HIERARCHICAL_DISPLAY_STYLE,
  getHierarchicalDisplayName,
} from "@/lib/utils/hierarchical-display";

import CloudDownloadOff from "@/components/shared/icons/cloud-download-off";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PermissionItemName = ({ item }: { item: FileOrFolder }) => {
  const { isFeatureEnabled } = useFeatureFlags();
  const isDataroomIndexEnabled = isFeatureEnabled("dataroomIndex");

  const displayName = getHierarchicalDisplayName(
    item.name,
    item.hierarchicalIndex,
    isDataroomIndexEnabled,
  );

  return (
    <div className="flex items-center text-foreground">
      {item.itemType === ItemType.DATAROOM_FOLDER ? (
        <Folder className="mr-2 h-5 w-5" />
      ) : (
        <File className="mr-2 h-5 w-5" />
      )}
      <span className="truncate" style={HIERARCHICAL_DISPLAY_STYLE}>
        {displayName}
      </span>
    </div>
  );
};

// Update the FileOrFolder type to include permissions
type FileOrFolder = {
  id: string;
  name: string;
  hierarchicalIndex?: string | null;
  subItems?: FileOrFolder[];
  permissions: {
    view: boolean;
    download: boolean;
    partialView?: boolean;
    partialDownload?: boolean;
  };
  itemType: ItemType;
  documentId?: string;
};

type ItemPermission = Record<
  string,
  { view: boolean; download: boolean; itemType: ItemType }
>;

type ColumnExtra = {
  updatePermissions: (id: string, newPermissions: string[]) => void;
};

const createColumns = (extra: ColumnExtra): ColumnDef<FileOrFolder>[] => [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          variant="ghost"
          onClick={row.getToggleExpandedHandler()}
          className="h-6 w-6 p-0"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ) : null;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <PermissionItemName item={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;

      const handleValueChange = (value: string[]) => {
        extra.updatePermissions(item.id, value);
      };

      return (
        <ToggleGroup
          type="multiple"
          value={Object.entries(item.permissions)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)}
          onValueChange={handleValueChange}
        >
          <ToggleGroupItem
            value="view"
            aria-label="Toggle view"
            size="sm"
            className={cn(
              "px-2 text-muted-foreground hover:ring-1 hover:ring-gray-400 data-[state=on]:bg-foreground data-[state=on]:text-background",
              item.permissions.view
                ? item.permissions.partialView
                  ? "data-[state=on]:bg-gray-400 data-[state=on]:text-background"
                  : "data-[state=on]:bg-foreground data-[state=on]:text-background"
                : "",
            )}
          >
            {item.permissions.view ||
            (item.permissions.view && item.permissions.partialView) ? (
              <EyeIcon className="h-5 w-5" />
            ) : (
              <EyeOffIcon className="h-5 w-5" />
            )}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="download"
            aria-label="Toggle download"
            size="sm"
            className={cn(
              "px-2 text-muted-foreground hover:ring-1 hover:ring-gray-400 data-[state=on]:bg-foreground data-[state=on]:text-background",
              item.permissions.download
                ? item.permissions.partialDownload
                  ? "data-[state=on]:bg-gray-400 data-[state=on]:text-background"
                  : "data-[state=on]:bg-foreground data-[state=on]:text-background"
                : "",
            )}
          >
            {item.permissions.download ||
            (item.permissions.download && item.permissions.partialDownload) ? (
              <ArrowDownToLineIcon className="h-5 w-5" />
            ) : (
              <CloudDownloadOff className="h-5 w-5" />
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      );
    },
  },
];

// Update the buildTree function to include permissions
const buildTree = (
  items: any[],
  permissions: ViewerGroupAccessControls[],
  parentId: string | null = null,
): FileOrFolder[] => {
  const getPermissions = (id: string) => {
    const permission = permissions.find((p) => p.itemId === id);
    return {
      view: permission?.canView ?? false,
      download: permission?.canDownload ?? false,
      partialView: false,
      partialDownload: false,
    };
  };

  const result: FileOrFolder[] = [];

  // Handle folders and their contents
  items
    .filter((item) => item.parentId === parentId && !item.document)
    .forEach((folder) => {
      const subItems = buildTree(items, permissions, folder.id);

      // Add documents directly in this folder
      const folderDocuments = (folder.documents || []).map((doc: any) => ({
        id: doc.id,
        documentId: doc.document.id,
        name: doc.document.name,
        hierarchicalIndex: doc.hierarchicalIndex,
        permissions: getPermissions(doc.id),
        itemType: ItemType.DATAROOM_DOCUMENT,
      }));

      const allSubItems = [...subItems, ...folderDocuments];

      const folderPermissions = getPermissions(folder.id);

      // Calculate view and partialView
      const someSubItemViewable = allSubItems.some(
        (subItem) => subItem.permissions.view,
      );
      const allSubItemsViewable = allSubItems.every(
        (subItem) => subItem.permissions.view,
      );
      const someSubItemDownloadable = allSubItems.some(
        (subItem) => subItem.permissions.download,
      );
      const allSubItemsDownloadable = allSubItems.every(
        (subItem) => subItem.permissions.download,
      );

      folderPermissions.view = folderPermissions.view || someSubItemViewable;
      folderPermissions.partialView =
        someSubItemViewable && !allSubItemsViewable;
      folderPermissions.download =
        folderPermissions.download || someSubItemDownloadable;
      folderPermissions.partialDownload =
        someSubItemDownloadable && !allSubItemsDownloadable;

      // Propagate view/download permission up if any subitem has view/download permission
      folderPermissions.view =
        folderPermissions.view ||
        allSubItems.some((subItem) => subItem.permissions.view);
      folderPermissions.download =
        folderPermissions.download ||
        allSubItems.some((subItem) => subItem.permissions.download);

      result.push({
        id: folder.id,
        name: folder.name,
        hierarchicalIndex: folder.hierarchicalIndex,
        subItems: allSubItems,
        permissions: folderPermissions,
        itemType: ItemType.DATAROOM_FOLDER,
      });
    });

  // Handle documents at the current level (including root level)
  items
    .filter(
      (item) =>
        (item.parentId === parentId && item.document) ||
        (parentId === null && item.folderId === null && item.document),
    )
    .forEach((doc) => {
      result.push({
        id: doc.id,
        documentId: doc.document.id,
        name: doc.document.name,
        hierarchicalIndex: doc.hierarchicalIndex,
        permissions: getPermissions(doc.id),
        itemType: ItemType.DATAROOM_DOCUMENT,
      });
    });

  return result;
};

export default function ExpandableTable({
  dataroomId,
  groupId,
  permissions,
}: {
  dataroomId: string;
  groupId: string;
  permissions: ViewerGroupAccessControls[];
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { folders, loading } = useDataroomFoldersTree({
    dataroomId,
    include_documents: true,
  });
  const [data, setData] = useState<FileOrFolder[]>([]);
  const [pendingChanges, setPendingChanges] = useState<ItemPermission>({});
  const [debouncedPendingChanges] = useDebounce(pendingChanges, 2000);

  const updatePermissions = useCallback(
    (id: string, newPermissions: string[]) => {
      const findItemAndParents = (
        items: FileOrFolder[],
        targetId: string,
        parents: FileOrFolder[] = [],
      ): { item: FileOrFolder; parents: FileOrFolder[] } | null => {
        for (const item of items) {
          if (item.id === targetId) {
            return { item, parents };
          }
          if (item.subItems) {
            const result = findItemAndParents(item.subItems, targetId, [
              ...parents,
              item,
            ]);
            if (result) return result;
          }
        }
        return null;
      };

      const result = findItemAndParents(data, id);
      if (!result) return;

      const { item, parents } = result;

      const updatedPermissions = {
        view: newPermissions.includes("view"),
        download: newPermissions.includes("download"),
        partialView: newPermissions.includes("partialView"),
        partialDownload: newPermissions.includes("partialDownload"),
      };

      // Special cases
      if (!updatedPermissions.view && item.permissions.download) {
        updatedPermissions.download = false;
      } else if (updatedPermissions.download && !updatedPermissions.view) {
        updatedPermissions.view = true;
      }

      if (updatedPermissions.partialDownload) {
        updatedPermissions.download = true;
      }

      if (updatedPermissions.partialView) {
        updatedPermissions.view = true;
      }

      setData((prevData) => {
        const updateItemInTree = (items: FileOrFolder[]): FileOrFolder[] => {
          return items.map((currentItem) => {
            if (currentItem.id === id) {
              const updatedItem = {
                ...currentItem,
                permissions: {
                  view: updatedPermissions.view,
                  download: updatedPermissions.download,
                  partialView: false,
                },
              };

              // If it's a folder, update all subitems
              if (updatedItem.itemType === ItemType.DATAROOM_FOLDER) {
                updatedItem.subItems = updateSubItems(
                  updatedItem.subItems || [],
                  updatedPermissions.view,
                  updatedPermissions.download,
                );
              }

              return updatedItem;
            }

            // if the current item is a parent of the updated item, update the parent's permissions
            if (parents.some((parent) => parent.id === currentItem.id)) {
              const updatedSubItems = currentItem.subItems
                ? updateItemInTree(currentItem.subItems)
                : [];
              return updateParentPermissions(currentItem, updatedSubItems);
            }

            // if the current item has subitems, update the subitems
            if (currentItem.subItems) {
              return {
                ...currentItem,
                subItems: updateItemInTree(currentItem.subItems),
              };
            }
            return currentItem;
          });
        };

        const updateSubItems = (
          items: FileOrFolder[],
          viewState: boolean,
          downloadState: boolean,
        ): FileOrFolder[] => {
          return items.map((item) => ({
            ...item,
            permissions: {
              ...item.permissions,
              view: viewState,
              partialView: false,
              partialDownload: false,
              download: downloadState,
            },
            subItems: item.subItems
              ? updateSubItems(item.subItems, viewState, downloadState)
              : undefined,
          }));
        };

        const updateParentPermissions = (
          parent: FileOrFolder,
          subItems: FileOrFolder[],
        ): FileOrFolder => {
          const someSubItemViewable = subItems.some(
            (subItem) => subItem.permissions.view,
          );
          const allSubItemsViewable = subItems.every(
            (subItem) => subItem.permissions.view,
          );
          const someSubItemDownloadable = subItems.some(
            (subItem) => subItem.permissions.download,
          );
          const allSubItemsDownloadable = subItems.every(
            (subItem) => subItem.permissions.download,
          );

          return {
            ...parent,
            permissions: {
              view: someSubItemViewable,
              partialView: someSubItemViewable && !allSubItemsViewable,
              download: someSubItemDownloadable,
              partialDownload:
                someSubItemDownloadable && !allSubItemsDownloadable,
            },
            subItems,
          };
        };

        return updateItemInTree(prevData);
      });

      // database changes
      const collectChanges = (
        item: FileOrFolder,
        parents: FileOrFolder[],
      ): ItemPermission => {
        let changes: ItemPermission = {
          [item.id]: {
            view: updatedPermissions.view,
            download: updatedPermissions.download,
            itemType: item.itemType,
          },
        };

        // Collect changes for all subitems
        const collectSubItemChanges = (
          subItems: FileOrFolder[] | undefined,
        ) => {
          if (!subItems) return;
          subItems.forEach((subItem) => {
            changes[subItem.id] = {
              view: updatedPermissions.view,
              download: updatedPermissions.download,
              itemType: subItem.itemType,
            };
            collectSubItemChanges(subItem.subItems);
          });
        };

        collectSubItemChanges(item.subItems);

        // Ensure all parent folders are viewable if the item is being set to viewable
        // and downloadable if the item is being set to downloadable
        if (updatedPermissions.view || updatedPermissions.download) {
          parents.forEach((parent) => {
            changes[parent.id] = {
              view: true, // Always enable view for parent folders if child is viewable
              download: updatedPermissions.download
                ? true
                : parent.permissions.download, // Always enable download for parent folders if child is downloadable
              itemType: parent.itemType,
            };
          });
        } else {
          // If turning off view, recalculate parent permissions
          [...parents].reverse().forEach((parent) => {
            const otherChildren =
              parent.subItems?.filter((subItem) => subItem.id !== item.id) ||
              [];
            const someSubItemViewable = otherChildren.some(
              (subItem) => subItem.permissions.view,
            );
            const someSubItemDownloadable = otherChildren.some(
              (subItem) => subItem.permissions.download,
            );

            changes[parent.id] = {
              view: someSubItemViewable,
              download: someSubItemDownloadable,
              itemType: parent.itemType,
            };
          });
        }

        return changes;
      };

      setPendingChanges((prev) => ({
        ...prev,
        ...collectChanges(item, parents),
      }));
    },
    [data],
  );

  useEffect(() => {
    if (folders && !loading) {
      const treeData = buildTree(folders, permissions);
      setData(treeData);
    }
  }, [folders, loading, permissions]);

  const saveChanges = useCallback(
    async (changes: typeof pendingChanges) => {
      try {
        const response = await fetch(
          `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/permissions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dataroomId,
              groupId,
              permissions: changes,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to save permissions");
        }

        toast.success("Permissions updated successfully.");

        setPendingChanges({});
      } catch (error) {
        console.error("Error saving permissions:", error);
        toast.error("Failed to update permissions", {
          description: "Please try again.",
        });
      }
    },
    [dataroomId, groupId],
  );

  useEffect(() => {
    if (Object.keys(debouncedPendingChanges).length > 0) {
      saveChanges(debouncedPendingChanges);
    }
  }, [debouncedPendingChanges, saveChanges]);

  const columns = useMemo(
    () => createColumns({ updatePermissions }),
    [updatePermissions],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subItems,
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="py-2 first:w-12 last:text-right"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      paddingLeft: `${row.depth * 1.25 + 1}rem`,
                    }}
                    className="py-2 last:flex last:justify-end"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
