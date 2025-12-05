"use client";

import { useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ItemType, PermissionGroupAccessControls } from "@prisma/client";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  File,
  Folder,
  HomeIcon,
  LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { useDataroomFoldersTree } from "@/lib/swr/use-dataroom";
import { LinkWithViews } from "@/lib/types";
import { cn, copyToClipboard, fetcher } from "@/lib/utils";
import {
  HIERARCHICAL_DISPLAY_STYLE,
  getHierarchicalDisplayName,
} from "@/lib/utils/hierarchical-display";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonTooltip } from "@/components/ui/tooltip";

type DocumentLink = {
  id: string;
  dataroomDocumentId: string;
  name: string;
  hierarchicalIndex?: string | null;
  directLink: string;
  itemType: ItemType;
  canView: boolean;
  subItems?: DocumentLink[];
};

interface DirectDocumentLinksSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  link: LinkWithViews;
  dataroomId: string;
}

// Build document links tree
const buildDocumentLinksTree = (
  items: any[],
  permissions: PermissionGroupAccessControls[],
  baseLink: string,
  parentId: string | null = null,
  dataroomIndexEnabled: boolean = false,
): DocumentLink[] => {
  const hasPermissions = permissions.length > 0;

  const getCanView = (id: string) => {
    if (!hasPermissions) return true;
    const permission = permissions.find((p) => p.itemId === id);
    return permission?.canView ?? false;
  };

  const result: DocumentLink[] = [];

  // Handle folders and their contents
  items
    .filter((item) => item.parentId === parentId && !item.document)
    .forEach((folder) => {
      const subItems = buildDocumentLinksTree(
        items,
        permissions,
        baseLink,
        folder.id,
        dataroomIndexEnabled,
      );

      // Add documents directly in this folder
      const folderDocuments = (folder.documents || []).map((doc: any) => ({
        id: doc.id,
        dataroomDocumentId: doc.id,
        name: getHierarchicalDisplayName(
          doc.document.name,
          doc.hierarchicalIndex,
          dataroomIndexEnabled,
        ),
        hierarchicalIndex: doc.hierarchicalIndex,
        directLink: `${baseLink}/d/${doc.id}`,
        itemType: ItemType.DATAROOM_DOCUMENT,
        canView: getCanView(doc.id),
      }));

      const allSubItems = [...subItems, ...folderDocuments];
      const folderCanView =
        allSubItems.some((item) => item.canView) || getCanView(folder.id);

      result.push({
        id: folder.id,
        dataroomDocumentId: folder.id,
        name: getHierarchicalDisplayName(
          folder.name,
          folder.hierarchicalIndex,
          dataroomIndexEnabled,
        ),
        hierarchicalIndex: folder.hierarchicalIndex,
        directLink: "", // Folders don't have direct links
        itemType: ItemType.DATAROOM_FOLDER,
        canView: folderCanView,
        subItems: allSubItems,
      });
    });

  // Handle documents that are direct children of the current parent
  items
    .filter(
      (item) =>
        (item.parentId === parentId && item.document) ||
        (parentId === null && item.folderId === null && item.document),
    )
    .forEach((doc) => {
      result.push({
        id: doc.id,
        dataroomDocumentId: doc.id,
        name: getHierarchicalDisplayName(
          doc.document.name,
          doc.hierarchicalIndex,
          dataroomIndexEnabled,
        ),
        hierarchicalIndex: doc.hierarchicalIndex,
        directLink: `${baseLink}/d/${doc.id}`,
        itemType: ItemType.DATAROOM_DOCUMENT,
        canView: getCanView(doc.id),
      });
    });

  return result;
};

// Flatten tree to get all viewable documents
const getViewableDocuments = (items: DocumentLink[]): DocumentLink[] => {
  const result: DocumentLink[] = [];

  const traverse = (items: DocumentLink[]) => {
    items.forEach((item) => {
      if (item.itemType === ItemType.DATAROOM_DOCUMENT && item.canView) {
        result.push(item);
      }
      if (item.subItems) {
        traverse(item.subItems);
      }
    });
  };

  traverse(items);
  return result;
};

function DocumentLinkRow({
  doc,
  depth = 0,
  expanded,
  onToggle,
  dataroomIndexEnabled,
}: {
  doc: DocumentLink;
  depth?: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  dataroomIndexEnabled: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isFolder = doc.itemType === ItemType.DATAROOM_FOLDER;
  const isExpanded = expanded.has(doc.id);
  const hasSubItems = doc.subItems && doc.subItems.length > 0;

  const handleCopy = () => {
    copyToClipboard(doc.directLink, "Link copied to clipboard.");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    window.open(doc.directLink, "_blank");
  };

  if (!doc.canView) return null;

  return (
    <>
      <TableRow className={cn(depth === 0 && "")}>
        <TableCell
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
          className="py-2"
        >
          <div className="flex items-center gap-2">
            {hasSubItems ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggle(doc.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="h-6 w-6" />
            )}
            {isFolder ? (
              <Folder className="h-4 w-4 text-muted-foreground" />
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className="truncate text-sm"
              style={HIERARCHICAL_DISPLAY_STYLE}
            >
              {doc.name}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-2">
          {!isFolder && (
            <div className="flex items-center gap-2">
              <span className="max-w-[300px] truncate font-mono text-xs text-muted-foreground">
                {doc.directLink}
              </span>
            </div>
          )}
        </TableCell>
        <TableCell className="py-2 text-right">
          {!isFolder && (
            <div className="flex items-center justify-end gap-1">
              <ButtonTooltip content="Copy link">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </ButtonTooltip>
              <ButtonTooltip content="Open in new tab">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleOpenLink}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </ButtonTooltip>
            </div>
          )}
        </TableCell>
      </TableRow>
      {hasSubItems &&
        isExpanded &&
        doc.subItems!.map((subDoc) => (
          <DocumentLinkRow
            key={subDoc.id}
            doc={subDoc}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            dataroomIndexEnabled={dataroomIndexEnabled}
          />
        ))}
    </>
  );
}

export function DirectDocumentLinksSheet({
  isOpen,
  setIsOpen,
  link,
  dataroomId,
}: DirectDocumentLinksSheetProps) {
  const { currentTeamId } = useTeam();
  const { isFeatureEnabled } = useFeatureFlags();
  const dataroomIndexEnabled = isFeatureEnabled("dataroomIndex");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { folders, loading: foldersLoading } = useDataroomFoldersTree({
    dataroomId,
    include_documents: true,
  });

  // Fetch permission group data if link has permissions
  const { data: permissionGroupData, isLoading: permissionsLoading } = useSWR<{
    permissionGroup: {
      id: string;
      name: string;
      description: string | null;
      accessControls: PermissionGroupAccessControls[];
    };
  }>(
    link.permissionGroupId && currentTeamId && isOpen
      ? `/api/teams/${currentTeamId}/datarooms/${dataroomId}/permission-groups/${link.permissionGroupId}`
      : null,
    fetcher,
  );

  // Build base link URL
  const baseLink = useMemo(() => {
    if (link.domainId && link.slug) {
      return `https://${link.domainSlug}/${link.slug}`;
    }
    return `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`;
  }, [link]);

  // Build document tree with links
  const documentLinks = useMemo(() => {
    if (!folders) return [];
    const permissions =
      permissionGroupData?.permissionGroup?.accessControls || [];
    return buildDocumentLinksTree(
      folders,
      permissions,
      baseLink,
      null,
      dataroomIndexEnabled,
    );
  }, [folders, permissionGroupData, baseLink, dataroomIndexEnabled]);

  // Get all viewable documents for "copy all" functionality
  const viewableDocuments = useMemo(
    () => getViewableDocuments(documentLinks),
    [documentLinks],
  );

  const handleToggle = (id: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allFolderIds: string[] = [];
    const collectFolderIds = (items: DocumentLink[]) => {
      items.forEach((item) => {
        if (item.itemType === ItemType.DATAROOM_FOLDER) {
          allFolderIds.push(item.id);
        }
        if (item.subItems) {
          collectFolderIds(item.subItems);
        }
      });
    };
    collectFolderIds(documentLinks);
    setExpanded(new Set(allFolderIds));
  };

  const handleCollapseAll = () => {
    setExpanded(new Set());
  };

  const handleCopyAllLinks = () => {
    const links = viewableDocuments.map((doc) => `${doc.name}: ${doc.directLink}`).join("\n");
    copyToClipboard(links, `${viewableDocuments.length} document links copied to clipboard.`);
  };

  const isLoading = foldersLoading || permissionsLoading;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex w-[90%] flex-col justify-between border-l border-gray-200 bg-background px-4 text-foreground dark:border-gray-800 dark:bg-gray-900 sm:w-[700px] sm:max-w-3xl md:px-5">
        <SheetHeader className="text-start">
          <SheetTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Direct Document Links
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Copy direct links to share specific documents from this dataroom
            link.
            {link.permissionGroupId && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                Only documents with view permissions are shown.
              </span>
            )}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Link Info */}
          <div className="mb-4 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Base link:</span>
              <span className="font-mono text-xs">{baseLink}</span>
            </div>
            {link.name && (
              <div className="mt-1 text-sm text-muted-foreground">
                Link name: <span className="text-foreground">{link.name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExpandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                Collapse All
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyAllLinks}
              disabled={viewableDocuments.length === 0}
            >
              <Copy className="h-4 w-4" />
              Copy All ({viewableDocuments.length})
            </Button>
          </div>

          {/* Document Links Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Document</TableHead>
                  <TableHead>Direct Link</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : documentLinks.length > 0 ? (
                  documentLinks.map((doc) => (
                    <DocumentLinkRow
                      key={doc.id}
                      doc={doc}
                      expanded={expanded}
                      onToggle={handleToggle}
                      dataroomIndexEnabled={dataroomIndexEnabled}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No documents found in this dataroom.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <SheetFooter>
          <div className="flex flex-row-reverse items-center gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
