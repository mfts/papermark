import { useRouter } from "next/router";

import { useMemo, useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { DocumentVersion, LinkAudienceType } from "@prisma/client";
import { isWithinInterval, subMinutes } from "date-fns";
import {
  BoxesIcon,
  Code2Icon,
  CopyPlusIcon,
  EyeIcon,
  FileSlidersIcon,
  LinkIcon,
  Settings2Icon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import z from "zod";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { LinkWithViews, WatermarkConfig } from "@/lib/types";
import { cn, copyToClipboard, fetcher, nFormatter, timeAgo } from "@/lib/utils";
import { useMediaQuery } from "@/lib/utils/use-media-query";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import FileProcessStatusBar from "../documents/file-process-status-bar";
import BarChart from "../shared/icons/bar-chart";
import ChevronDown from "../shared/icons/chevron-down";
import MoreHorizontal from "../shared/icons/more-horizontal";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { ButtonTooltip } from "../ui/tooltip";
import EmbedCodeModal from "./embed-code-modal";
import LinkActiveControls, {
  countActiveSettings,
} from "./link-active-controls";
import LinkSheet, {
  DEFAULT_LINK_PROPS,
  type DEFAULT_LINK_TYPE,
} from "./link-sheet";
import { DataroomLinkSheet } from "./link-sheet/dataroom-link-sheet";
import { PermissionsSheet } from "./link-sheet/permissions-sheet";
import { TagColumn } from "./link-sheet/tags/tag-details";
import LinksVisitors from "./links-visitors";
import { PreviewButton } from "./preview-button";

const isDocumentProcessing = (version?: DocumentVersion) => {
  if (!version) return false;
  return (
    !version.hasPages &&
    ["pdf", "slides", "docs", "cad"].includes(version.type!)
  );
};

export default function LinksTable({
  targetType,
  links,
  primaryVersion,
  mutateDocument,
}: {
  targetType: "DOCUMENT" | "DATAROOM";
  links?: LinkWithViews[];
  primaryVersion?: DocumentVersion;
  mutateDocument?: () => void;
}) {
  const [tags, _] = useQueryState<string[]>("tags", {
    parse: (value: string) => value.split(",").filter(Boolean),
    serialize: (value: string[]) => value.join(","),
  });

  const selectedTagNames = useMemo(() => tags ?? [], [tags]);

  const now = Date.now();
  const router = useRouter();
  const { isFree, isTrial } = usePlan();
  const { currentTeamId } = useTeam();
  const { id: targetId, groupId } = router.query as {
    id: string;
    groupId?: string;
  };

  const { isMobile } = useMediaQuery();

  let processedLinks = useMemo(() => {
    if (!links?.length) return [];

    const oneMinuteAgo = subMinutes(now, 1);
    const sortedLinks = links.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return sortedLinks.map((link) => {
      const createdDate = new Date(link.createdAt);
      const updatedDate = new Date(link.updatedAt);

      return {
        ...link,
        isNew: isWithinInterval(createdDate, {
          start: oneMinuteAgo,
          end: now,
        }),
        isUpdated:
          isWithinInterval(updatedDate, {
            start: oneMinuteAgo,
            end: now,
          }) && updatedDate.getTime() !== createdDate.getTime(),
      };
    });
  }, [links, now]);

  processedLinks = useMemo(() => {
    if (!links?.length) return [];
    return processedLinks.filter((link) => {
      if (selectedTagNames.length === 0) return true;
      return link.tags.some((tag) => selectedTagNames.includes(tag.name));
    });
  }, [links, processedLinks, selectedTagNames]);

  const { canAddLinks } = useLimits();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingLinks, setLoadingLinks] = useState<Set<string>>(new Set());
  const [isLinkSheetVisible, setIsLinkSheetVisible] = useState<boolean>(false);
  const [selectedLink, setSelectedLink] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(`${targetType}_LINK`, groupId),
  );
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedEmbedLink, setSelectedEmbedLink] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const [showPermissionsSheet, setShowPermissionsSheet] =
    useState<boolean>(false);
  const [editPermissionLink, setEditPermissionLink] =
    useState<LinkWithViews | null>(null);

  const handleCopyToClipboard = (linkString: string) => {
    copyToClipboard(`${linkString}`, "Link copied to clipboard.");
  };

  const handleEditLink = (link: LinkWithViews) => {
    setSelectedLink({
      id: link.id,
      name: link.name || `Link #${link.id.slice(-5)}`,
      domain: link.domainSlug,
      slug: link.slug,
      expiresAt: link.expiresAt,
      password: link.password,
      emailProtected: link.emailProtected,
      emailAuthenticated: link.emailAuthenticated,
      allowDownload: link.allowDownload ? link.allowDownload : false,
      allowList: link.allowList,
      denyList: link.denyList,
      enableNotification: link.enableNotification
        ? link.enableNotification
        : false,
      enableFeedback: link.enableFeedback ? link.enableFeedback : false,
      enableScreenshotProtection: link.enableScreenshotProtection
        ? link.enableScreenshotProtection
        : false,
      enableCustomMetatag: link.enableCustomMetatag
        ? link.enableCustomMetatag
        : false,
      enableQuestion: link.enableQuestion ? link.enableQuestion : false,
      questionText: link.feedback ? link.feedback.data?.question : "",
      questionType: link.feedback ? link.feedback.data?.type : "",
      metaTitle: link.metaTitle,
      metaDescription: link.metaDescription,
      metaImage: link.metaImage,
      metaFavicon: link.metaFavicon,
      enableAgreement: link.enableAgreement ? link.enableAgreement : false,
      agreementId: link.agreementId,
      showBanner: link.showBanner ?? false,
      enableWatermark: link.enableWatermark ?? false,
      watermarkConfig: link.watermarkConfig as WatermarkConfig | null,
      audienceType: link.audienceType,
      groupId: link.groupId,
      customFields: link.customFields || [],
      tags: link.tags.map((tag) => tag.id) || [],
      enableConversation: link.enableConversation ?? false,
      enableUpload: link.enableUpload ?? false,
      isFileRequestOnly: link.isFileRequestOnly ?? false,
      uploadFolderId: link.uploadFolderId ?? null,
      uploadFolderName: link.uploadFolderName ?? "Home",
      enableIndexFile: link.enableIndexFile ?? false,
      permissionGroupId: link.permissionGroupId ?? null,
    });
    //wait for dropdown to close before opening the link sheet
    setTimeout(() => {
      setIsLinkSheetVisible(true);
    }, 0);
  };

  const handlePreviewLink = async (link: LinkWithViews) => {
    if (link.domainId && isFree) {
      toast.error("You need to upgrade to preview this link");
      return;
    }

    if (isDocumentProcessing(primaryVersion)) {
      toast.error(
        "Document is still processing. Please wait a moment and try again.",
      );
      return;
    }

    const response = await fetch(`/api/links/${link.id}/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      toast.error("Failed to generate preview link");
      return;
    }

    const { previewToken } = await response.json();
    const previewLink = `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}?previewToken=${previewToken}`;

    window.open(previewLink, "_blank");
  };

  const handleDuplicateLink = async (link: LinkWithViews) => {
    setIsLoading(true);

    const response = await fetch(`/api/links/${link.id}/duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId: currentTeamId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const duplicatedLink = await response.json();
    const endpointTargetType = `${targetType.toLowerCase()}s`; // "documents" or "datarooms"

    // Update the duplicated link in the list of links
    mutate(
      `/api/teams/${currentTeamId}/${endpointTargetType}/${encodeURIComponent(
        link.documentId ?? link.dataroomId ?? "",
      )}/links`,
      (links || []).concat(duplicatedLink),
      false,
    );

    // Update the group-specific links cache if this is a group link
    if (!!groupId) {
      const groupLinks =
        links?.filter((link) => link.groupId === groupId) || [];
      mutate(
        `/api/teams/${currentTeamId}/${endpointTargetType}/${encodeURIComponent(
          duplicatedLink.documentId ?? duplicatedLink.dataroomId ?? "",
        )}/groups/${duplicatedLink.groupId}/links`,
        groupLinks.concat(duplicatedLink),
        false,
      );
    }

    toast.success("Link duplicated successfully");
    setIsLoading(false);
  };

  const handleEditPermissions = (link: LinkWithViews) => {
    setEditPermissionLink(link);
    setShowPermissionsSheet(true);
  };

  const handlePermissionsSave = async (permissions: any) => {
    if (!editPermissionLink) return;

    // Handle the case where user wants to share entire dataroom (permissions === null)
    if (permissions === null && editPermissionLink.permissionGroupId) {
      // Delete the permission group - database will set permissionGroupId to null automatically
      try {
        const teamIdParsed = z.string().cuid().parse(currentTeamId);
        const targetIdParsed = z.string().cuid().parse(targetId);
        const permissionGroupIdParsed = z
          .string()
          .cuid()
          .parse(editPermissionLink.permissionGroupId);

        const deleteResponse = await fetch(
          `/api/teams/${teamIdParsed}/datarooms/${targetIdParsed}/permission-groups/${permissionGroupIdParsed}`,
          {
            method: "DELETE",
          },
        );

        if (!deleteResponse.ok) {
          const { error } = await deleteResponse.json();
          throw new Error(error ?? "Failed to delete permission group");
        }

        // Refresh the links cache
        const endpointTargetType = `${targetType.toLowerCase()}s`;
        mutate(
          `/api/teams/${teamIdParsed}/${endpointTargetType}/${encodeURIComponent(
            targetIdParsed,
          )}/links`,
          (currentLinks: LinkWithViews[] | undefined) =>
            (currentLinks || []).map((link: LinkWithViews) =>
              link.id === editPermissionLink.id
                ? { ...link, permissionGroupId: null }
                : link,
            ),
          false,
        );

        // Invalidate the permission group cache
        mutate(
          `/api/teams/${teamIdParsed}/datarooms/${targetIdParsed}/permission-groups/${permissionGroupIdParsed}`,
        );

        setShowPermissionsSheet(false);
        setEditPermissionLink(null);
        toast.success("File permissions updated successfully");
      } catch (error) {
        console.error("Error updating file permissions:", error);
        toast.error("Failed to update file permissions");
      }
      return;
    }

    if (!editPermissionLink.permissionGroupId) {
      setIsLoading(true);
      try {
        const teamIdParsed = z.string().cuid().parse(currentTeamId);
        const targetIdParsed = z.string().cuid().parse(targetId);
        const response = await fetch(
          `/api/teams/${teamIdParsed}/datarooms/${targetIdParsed}/permission-groups`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              permissions: permissions,
              linkId: editPermissionLink.id,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create permission group");
        }

        const { permissionGroup: newPermissionGroup, _ } =
          await response.json();

        // Refresh the links cache
        const endpointTargetType = `${targetType.toLowerCase()}s`;
        mutate(
          `/api/teams/${currentTeamId}/${endpointTargetType}/${encodeURIComponent(
            targetId,
          )}/links`,
        );

        // Cache the new permission group data
        if (newPermissionGroup?.id) {
          mutate(
            `/api/teams/${currentTeamId}/datarooms/${targetId}/permission-groups/${newPermissionGroup.id}`,
            newPermissionGroup,
            false,
          );
        }

        setShowPermissionsSheet(false);
        setEditPermissionLink(null);
        toast.success("File permissions updated successfully");
      } catch (error) {
        console.error("Error creating permission group:", error);
        toast.error("Failed to create permission group");
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        // Update the permissions for the existing link
        const teamIdParsed = z.string().cuid().parse(currentTeamId);
        const targetIdParsed = z.string().cuid().parse(targetId);
        const permissionGroupIdParsed = z
          .string()
          .cuid()
          .parse(editPermissionLink.permissionGroupId);

        const res = await fetch(
          `/api/teams/${teamIdParsed}/datarooms/${targetIdParsed}/permission-groups/${permissionGroupIdParsed}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              permissions: permissions,
              linkId: editPermissionLink.id,
            }),
          },
        );

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? "Failed to update permissions");
        }

        // Refresh the links cache
        const endpointTargetType = `${targetType.toLowerCase()}s`;
        mutate(
          `/api/teams/${currentTeamId}/${endpointTargetType}/${encodeURIComponent(
            targetId,
          )}/links`,
        );

        // Invalidate the permission group cache
        if (editPermissionLink.permissionGroupId) {
          mutate(
            `/api/teams/${currentTeamId}/datarooms/${targetId}/permission-groups/${editPermissionLink.permissionGroupId}`,
          );
        }

        setShowPermissionsSheet(false);
        setEditPermissionLink(null);
        toast.success("File permissions updated successfully");
      } catch (error) {
        console.error("Error updating file permissions:", error);
        toast.error("Failed to update file permissions");
      }
    }
  };

  const AddLinkButton = () => {
    if (!canAddLinks) {
      return (
        <UpgradePlanModal
          clickedPlan={isTrial ? PlanEnum.Business : PlanEnum.Pro}
          trigger={"limit_add_link"}
        >
          <Button>Upgrade to Create Link</Button>
        </UpgradePlanModal>
      );
    } else {
      return (
        <Button onClick={() => setIsLinkSheetVisible(true)}>
          Create link to share
        </Button>
      );
    }
  };

  const handleArchiveLink = async (
    linkId: string,
    targetId: string,
    isArchived: boolean,
  ) => {
    setLoadingLinks((prev) => new Set(prev).add(linkId));

    try {
      const response = await fetch(`/api/links/${linkId}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: !isArchived,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const archivedLink = await response.json();
      const endpointTargetType = `${targetType.toLowerCase()}s`; // "documents" or "datarooms"

      // Update the archived link in the list of links
      mutate(
        `/api/teams/${currentTeamId}/${endpointTargetType}/${encodeURIComponent(
          targetId,
        )}/links`,
        (links || []).map((link) => (link.id === linkId ? archivedLink : link)),
        false,
      );

      // Update the group-specific links cache if this is a group link
      if (!!groupId) {
        const groupLinks =
          links?.filter((link) => link.groupId === groupId) || [];
        mutate(
          `/api/teams/${currentTeamId}/${endpointTargetType}/${encodeURIComponent(
            archivedLink.documentId ?? archivedLink.dataroomId ?? "",
          )}/groups/${groupId}/links`,
          groupLinks.map((link) => (link.id === linkId ? archivedLink : link)),
          false,
        );
      }

      toast.success(
        !isArchived
          ? "Link successfully archived"
          : "Link successfully reactivated",
      );
    } catch (error) {
      console.error("Error archiving link:", error);
      toast.error("Failed to update link status");
    } finally {
      setLoadingLinks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(linkId);
        return newSet;
      });
    }
  };

  const hasAnyTags = useMemo(
    () =>
      processedLinks.reduce(
        (acc, link) => acc || (link?.tags && link.tags.length > 0),
        false,
      ),
    [processedLinks],
  );

  return (
    <>
      <div className="w-full">
        <div className={cn(targetType === "DATAROOM" && "hidden")}>
          <h2 className="mb-2 md:mb-4">All links</h2>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="w-[150px] sm:w-[200px] md:w-[250px]">
                  Link
                </TableHead>
                {hasAnyTags ? (
                  <TableHead className="w-[250px] 2xl:w-auto">Tags</TableHead>
                ) : null}
                <TableHead className="w-[250px] sm:w-auto">Views</TableHead>
                <TableHead>Last Viewed</TableHead>
                <TableHead className="w-[80px]">Active</TableHead>
                <TableHead className="text-center sm:text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedLinks && processedLinks.length > 0 ? (
                processedLinks.map((link) => (
                  <Collapsible key={link.id} asChild>
                    <>
                      <TableRow
                        key={link.id}
                        className={cn(
                          "group/row",
                          popoverOpen === link.id && "bg-gray-100",
                          link.isArchived &&
                            "bg-gray-50 opacity-50 dark:bg-gray-700",
                        )}
                      >
                        <TableCell className="w-[250px] truncate font-medium">
                          <div className="flex items-center gap-x-2">
                            {link.groupId ? (
                              <ButtonTooltip content="Group Link">
                                <BoxesIcon className="size-4" />
                              </ButtonTooltip>
                            ) : null}
                            {link.name || `Link #${link.id.slice(-5)}`}
                            {link.isNew && !link.isUpdated && (
                              <Badge
                                variant="outline"
                                className="border-emerald-600/80 text-emerald-600/80"
                              >
                                New
                              </Badge>
                            )}
                            {link.isUpdated && (
                              <Badge
                                variant="outline"
                                className="border-blue-500/80 text-blue-500/80"
                              >
                                Updated
                              </Badge>
                            )}
                            {link.domainId && isFree ? (
                              <span className="ml-2 rounded-full bg-destructive px-2.5 py-0.5 text-xs text-foreground ring-1 ring-destructive">
                                Inactive
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="flex items-center gap-x-2 sm:min-w-[300px] md:min-w-[400px] lg:min-w-[450px]">
                          <div
                            className={cn(
                              `group/cell relative flex w-full items-center gap-x-4 overflow-hidden truncate rounded-sm px-3 py-1.5 text-center text-secondary-foreground transition-all group-hover/row:ring-1 group-hover/row:ring-gray-400 group-hover/row:dark:ring-gray-100 md:py-1`,
                              link.domainId && isFree
                                ? "bg-destructive hover:bg-red-700 hover:dark:bg-red-200"
                                : "bg-secondary hover:bg-emerald-700 hover:dark:bg-emerald-200",
                              popoverOpen === link.id &&
                                "ring-1 ring-gray-400 dark:ring-gray-100",
                            )}
                          >
                            {/* Progress bar */}
                            {isDocumentProcessing(primaryVersion) &&
                              primaryVersion && (
                                <FileProcessStatusBar
                                  documentVersionId={primaryVersion.id}
                                  className="absolute bottom-0 left-0 right-0 top-0 z-20 flex h-full items-center gap-x-8"
                                  // @ts-ignore: mutateDocument is not present on datarooms but on document pages
                                  mutateDocument={mutateDocument}
                                />
                              )}

                            <div className="flex w-full whitespace-nowrap text-sm group-hover/cell:opacity-0">
                              {link.domainId
                                ? `https://${link.domainSlug}/${link.slug}`
                                : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`}
                            </div>

                            {link.domainId && isFree ? (
                              <button
                                className="absolute bottom-0 left-0 right-0 top-0 z-10 hidden w-full whitespace-nowrap text-center text-sm group-hover/cell:block group-hover/cell:text-primary-foreground"
                                onClick={() => router.push("/settings/billing")}
                                title="Upgrade to activate link"
                              >
                                Upgrade to activate link
                              </button>
                            ) : (
                              <button
                                className="absolute bottom-0 left-0 right-0 top-0 z-10 hidden w-full whitespace-nowrap text-center text-xs group-hover/cell:block group-hover/cell:text-primary-foreground sm:text-sm"
                                onClick={() =>
                                  handleCopyToClipboard(
                                    link.domainId
                                      ? `https://${link.domainSlug}/${link.slug}`
                                      : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`,
                                  )
                                }
                                title="Copy & Share"
                              >
                                Copy & Share
                              </button>
                            )}
                          </div>
                          <PreviewButton
                            link={link}
                            isProcessing={isDocumentProcessing(primaryVersion)}
                            onPreview={handlePreviewLink}
                          />
                          {targetType === "DATAROOM" &&
                            link.permissionGroupId && (
                              <ButtonTooltip content="Limited File Access">
                                <FileSlidersIcon className="text-gray-400 group-hover:text-gray-500" />
                              </ButtonTooltip>
                            )}
                          {isMobile ? (
                            <ButtonTooltip content="Edit link">
                              <Button
                                variant={"link"}
                                size={"icon"}
                                className="group h-7 w-8"
                                onClick={() => handleEditLink(link)}
                              >
                                <span className="sr-only">Edit link</span>
                                <Settings2Icon className="text-gray-400 group-hover:text-gray-500" />
                              </Button>
                            </ButtonTooltip>
                          ) : (
                            <Popover
                              open={popoverOpen === link.id}
                              onOpenChange={() => {}}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="link"
                                  className={cn(
                                    "h-7 font-normal hover:no-underline focus-visible:ring-0 focus-visible:ring-offset-0",
                                    popoverOpen === link.id
                                      ? "text-foreground"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleEditLink(link);
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onMouseEnter={() => {
                                    hoverTimeout.current = setTimeout(
                                      () => setPopoverOpen(link.id),
                                      250,
                                    );
                                  }}
                                  onMouseLeave={() => {
                                    if (hoverTimeout.current)
                                      clearTimeout(hoverTimeout.current);

                                    // Add delay before closing to prevent flickering
                                    hoverTimeout.current = setTimeout(
                                      () => setPopoverOpen(null),
                                      100,
                                    );
                                  }}
                                >
                                  <Settings2Icon strokeWidth={1.75} />
                                  <span className="whitespace-nowrap">
                                    {countActiveSettings(link)}{" "}
                                    {countActiveSettings(link) === 1
                                      ? "control"
                                      : "controls"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                side="top"
                                align="start"
                                className="w-56 p-0"
                                onMouseEnter={() => {
                                  if (hoverTimeout.current)
                                    clearTimeout(hoverTimeout.current);
                                  setPopoverOpen(link.id);
                                }}
                                onMouseLeave={() => {
                                  if (hoverTimeout.current)
                                    clearTimeout(hoverTimeout.current);

                                  // Add delay before closing to prevent flickering
                                  hoverTimeout.current = setTimeout(
                                    () => setPopoverOpen(null),
                                    100,
                                  );
                                }}
                              >
                                <LinkActiveControls
                                  link={link}
                                  onEditClick={(e) => {
                                    e.preventDefault();
                                    handleEditLink(link);
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </TableCell>
                        {hasAnyTags ? (
                          <TableCell className="w-[250px] 2xl:w-auto">
                            <TagColumn link={link} />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <CollapsibleTrigger
                            disabled={
                              Number(nFormatter(link._count.views)) === 0 ||
                              targetType === "DATAROOM"
                            }
                          >
                            <div className="flex items-center space-x-1 [&[data-state=open]>svg.chevron]:rotate-180">
                              <BarChart className="h-4 w-4 text-muted-foreground" />
                              <p className="whitespace-nowrap text-sm text-muted-foreground">
                                {nFormatter(link._count.views)}
                                <span className="ml-1 hidden sm:inline-block">
                                  views
                                </span>
                              </p>
                              {Number(nFormatter(link._count.views)) > 0 &&
                              targetType !== "DATAROOM" ? (
                                <ChevronDown className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                              ) : null}
                            </div>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {link.views[0] ? (
                            <time
                              dateTime={new Date(
                                link.views[0].viewedAt,
                              ).toISOString()}
                            >
                              {timeAgo(link.views[0].viewedAt)}
                            </time>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-x-1">
                            <Switch
                              className="data-[state=checked]:bg-primary/80 data-[state=checked]:hover:bg-primary data-[state=unchecked]:hover:bg-muted-foreground/80"
                              id={`${link.id}-active-switch`}
                              checked={!link.isArchived}
                              onCheckedChange={(checked) =>
                                handleArchiveLink(
                                  link.id,
                                  link.documentId ?? link.dataroomId ?? "",
                                  checked,
                                )
                              }
                              disabled={loadingLinks.has(link.id)}
                            />
                            <Label
                              className="font-normal"
                              htmlFor={`${link.id}-active-switch`}
                            >
                              {link.isArchived ? "No" : "Yes"}
                            </Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-center sm:text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 group-hover/row:ring-1 group-hover/row:ring-gray-200 group-hover/row:dark:ring-gray-700"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleEditLink(link)}
                              >
                                <Settings2Icon className="mr-2 h-4 w-4" />
                                Edit Link
                              </DropdownMenuItem>
                              {targetType === "DATAROOM" &&
                                link.audienceType !==
                                  LinkAudienceType.GROUP && (
                                  <DropdownMenuItem
                                    onClick={() => handleEditPermissions(link)}
                                    disabled={isLoading}
                                  >
                                    <FileSlidersIcon className="mr-2 h-4 w-4" />
                                    Edit File Permissions
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuItem
                                onClick={() => handlePreviewLink(link)}
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Preview Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canAddLinks}
                                onClick={() => handleDuplicateLink(link)}
                              >
                                <CopyPlusIcon className="mr-2 h-4 w-4" />
                                Duplicate Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmbedLink({
                                    id: link.id,
                                    name:
                                      link.name || `Link #${link.id.slice(-5)}`,
                                  });
                                  setEmbedModalOpen(true);
                                }}
                              >
                                <Code2Icon className="mr-2 h-4 w-4" />
                                Get Embed Code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <LinksVisitors
                          linkName={link.name || "No link name"}
                          linkId={link.id}
                        />
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={hasAnyTags ? 7 : 6}>
                    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-xl py-4">
                      <div className="hidden rounded-full sm:block">
                        <div
                          className={cn(
                            "rounded-full border border-white bg-gradient-to-t from-gray-100 p-1 md:p-3",
                          )}
                        >
                          <LinkIcon className="size-6" />
                        </div>
                      </div>
                      <p>No links found for this {targetType.toLowerCase()}</p>
                      <AddLinkButton />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {targetType === "DATAROOM" ? (
          <>
            <DataroomLinkSheet
              isOpen={isLinkSheetVisible}
              setIsOpen={setIsLinkSheetVisible}
              linkType={`${targetType}_LINK`}
              currentLink={selectedLink.id ? selectedLink : undefined}
              existingLinks={links}
            />

            <PermissionsSheet
              isOpen={showPermissionsSheet}
              setIsOpen={(open: boolean) => {
                setShowPermissionsSheet(open);
                if (!open) {
                  setEditPermissionLink(null);
                }
              }}
              dataroomId={targetId}
              linkId={editPermissionLink?.id}
              permissionGroupId={editPermissionLink?.permissionGroupId}
              onSave={handlePermissionsSave}
            />
          </>
        ) : (
          <LinkSheet
            isOpen={isLinkSheetVisible}
            setIsOpen={setIsLinkSheetVisible}
            linkType={`${targetType}_LINK`}
            currentLink={selectedLink.id ? selectedLink : undefined}
            existingLinks={links}
          />
        )}

        {selectedEmbedLink && (
          <EmbedCodeModal
            isOpen={embedModalOpen}
            setIsOpen={setEmbedModalOpen}
            linkId={selectedEmbedLink.id}
            linkName={selectedEmbedLink.name}
          />
        )}
      </div>
    </>
  );
}
