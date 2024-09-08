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

import { useDataroomFoldersTree } from "@/lib/swr/use-dataroom";

// Update the FileOrFolder type to include permissions
type FileOrFolder = {
  id: string;
  name: string;
  subItems?: FileOrFolder[];
  permissions: {
    view: boolean;
    download: boolean;
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
    cell: ({ row }) => (
      <div className="flex items-center text-foreground">
        {row.original.itemType === ItemType.DATAROOM_FOLDER ? (
          <Folder className="mr-2 h-5 w-5" />
        ) : (
          <File className="mr-2 h-5 w-5" />
        )}
        <span className="truncate">{row.original.name}</span>
      </div>
    ),
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
            className="text-muted-foreground hover:ring-1 hover:ring-gray-400 data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {item.permissions.view ? (
              <EyeIcon className="h-5 w-5" />
            ) : (
              <EyeOffIcon className="h-5 w-5" />
            )}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="download"
            aria-label="Toggle download"
            size="sm"
            className="text-muted-foreground hover:ring-1 hover:ring-gray-400 data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {item.permissions.download ? (
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
  folders: any[],
  documents: any[],
  permissions: ViewerGroupAccessControls[],
  parentId: string | null = null,
): FileOrFolder[] => {
  const items: FileOrFolder[] = [];

  const getPermissions = (id: string) => {
    const permission = permissions.find((p) => p.itemId === id);
    return {
      view: permission?.canView ?? false,
      download: permission?.canDownload ?? false,
    };
  };

  folders
    .filter((folder) => folder.parentId === parentId)
    .forEach((folder) => {
      const folderDocuments = folder.documents.map((doc: any) => ({
        id: doc.id,
        documentId: doc.documentId,
        name: doc.document.name,
        permissions: getPermissions(doc.id),
        itemType: ItemType.DATAROOM_DOCUMENT,
      }));

      const subItems = [
        ...buildTree(folders, [], permissions, folder.id),
        ...folderDocuments,
      ];

      const folderPermissions = getPermissions(folder.id);
      // Propagate view permission up if any subitem has view permission
      folderPermissions.view =
        folderPermissions.view ||
        subItems.some((item) => item.permissions.view);

      items.push({
        id: folder.id,
        name: folder.name,
        subItems: subItems,
        permissions: folderPermissions,
        itemType: ItemType.DATAROOM_FOLDER,
      });
    });

  if (parentId === null) {
    items.push(
      ...documents.map((doc: any) => ({
        id: doc.id,
        documentId: doc.document.id,
        name: doc.document.name,
        permissions: getPermissions(doc.id),
        itemType: ItemType.DATAROOM_DOCUMENT,
      })),
    );
  }

  return items;
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

  console.log("folders", folders);

  const updatePermissions = useCallback(
    (id: string, newPermissions: string[]) => {
      const findItemById = (
        items: FileOrFolder[],
        targetId: string,
      ): FileOrFolder | null => {
        for (const item of items) {
          if (item.id === targetId) return item;
          if (item.subItems) {
            const found = findItemById(item.subItems, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const item = findItemById(data, id);
      if (!item) return;

      const updatedPermissions = {
        view: newPermissions.includes("view"),
        download: newPermissions.includes("download"),
      };

      // Special cases
      if (!updatedPermissions.view && item.permissions.download) {
        // If view is toggled off, also toggle off download
        updatedPermissions.download = false;
      } else if (updatedPermissions.download && !updatedPermissions.view) {
        // If download is toggled on, also toggle on view
        updatedPermissions.view = true;
      }

      const updateItemAndSubItems = (item: FileOrFolder): FileOrFolder => {
        const updatedItem = {
          ...item,
          permissions: updatedPermissions,
        };

        if (item.subItems) {
          updatedItem.subItems = item.subItems.map(updateItemAndSubItems);
        }

        return updatedItem;
      };

      const updatedItem = updateItemAndSubItems(item);

      setData((prevData) => {
        const updateItemInTree = (items: FileOrFolder[]): FileOrFolder[] => {
          return items.map((item) => {
            if (item.id === id) {
              return updatedItem;
            }
            if (item.subItems) {
              return {
                ...item,
                subItems: updateItemInTree(item.subItems),
              };
            }
            return item;
          });
        };
        return updateItemInTree(prevData);
      });

      const collectChanges = (item: FileOrFolder): ItemPermission => {
        let changes = {
          [item.id]: {
            ...updatedPermissions,
            itemType: item.itemType,
          },
        };

        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            changes = { ...changes, ...collectChanges(subItem) };
          });
        }

        return changes;
      };

      setPendingChanges((prev) => ({
        ...prev,
        ...collectChanges(updatedItem),
      }));
    },
    [data],
  );

  useEffect(() => {
    if (folders && !loading) {
      const treeData = buildTree(
        // @ts-ignore
        folders.filter((folder) => folder.parentId == null && !folder.document),
        // @ts-ignore
        folders.filter((folder) => folder.folderId == null && folder.document),
        permissions,
      );
      setData(treeData);
    }
  }, [folders, loading, permissions]);

  console.log("data", data);

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

        toast.success("Permissions updated", {
          description: "The permissions have been successfully updated.",
        });

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

  console.log("permissions", permissions);

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
