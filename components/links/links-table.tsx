import { useRouter } from "next/router";

import { useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { DocumentVersion, LinkAudienceType } from "@prisma/client";
import { isWithinInterval, subMinutes } from "date-fns";
import {
  ArchiveIcon,
  BoxesIcon,
  Code2Icon,
  CopyPlusIcon,
  EyeIcon,
  LinkIcon,
  Settings2Icon,
} from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { LinkWithViews, WatermarkConfig } from "@/lib/types";
import { cn, copyToClipboard, fetcher, nFormatter, timeAgo } from "@/lib/utils";

import FileProcessStatusBar from "../documents/file-process-status-bar";
import BarChart from "../shared/icons/bar-chart";
import ChevronDown from "../shared/icons/chevron-down";
import MoreHorizontal from "../shared/icons/more-horizontal";
import { Badge } from "../ui/badge";
import { ButtonTooltip } from "../ui/tooltip";
import EmbedCodeModal from "./embed-code-modal";
import LinkSheet, {
  DEFAULT_LINK_PROPS,
  type DEFAULT_LINK_TYPE,
} from "./link-sheet";
import LinksVisitors from "./links-visitors";

export default function LinksTable({
  targetType,
  links,
  primaryVersion,
  mutateDocument,
  isDataroomArchived,
}: {
  targetType: "DOCUMENT" | "DATAROOM";
  links?: LinkWithViews[];
  primaryVersion?: DocumentVersion;
  mutateDocument?: () => void;
  isDataroomArchived?: boolean;
}) {
  const now = Date.now();
  const router = useRouter();
  const { isFree } = usePlan();
  const teamInfo = useTeam();
  const { groupId } = router.query as {
    groupId?: string;
  };

  const processedLinks = useMemo(() => {
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

  const { canAddLinks } = useLimits();
  const { data: features } = useSWR<{
    embedding: boolean;
  }>(
    teamInfo?.currentTeam?.id
      ? `/api/feature-flags?teamId=${teamInfo.currentTeam.id}`
      : null,
    fetcher,
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLinkSheetVisible, setIsLinkSheetVisible] = useState<boolean>(false);
  const [selectedLink, setSelectedLink] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(`${targetType}_LINK`, groupId),
  );
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedEmbedLink, setSelectedEmbedLink] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
        teamId: teamInfo?.currentTeam?.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const duplicatedLink = await response.json();
    const endpointTargetType = `${targetType.toLowerCase()}s`; // "documents" or "datarooms"

    // Update the duplicated link in the list of links
    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
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
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
          duplicatedLink.documentId ?? duplicatedLink.dataroomId ?? "",
        )}/groups/${duplicatedLink.groupId}/links`,
        groupLinks.concat(duplicatedLink),
        false,
      );
    }

    toast.success("Link duplicated successfully");
    setIsLoading(false);
  };

  const AddLinkButton = () => {
    if (!canAddLinks) {
      return (
        <UpgradePlanModal clickedPlan={PlanEnum.Pro} trigger={"limit_add_link"}>
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
    if (targetId && isDataroomArchived) {
      toast.error("Can not archive dataroom link! Dataroom is archived.");
      return;
    }

    setIsLoading(true);

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
      `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
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
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
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
    setIsLoading(false);
  };

  const archivedLinksCount = links
    ? links.filter((link) => link.isArchived).length
    : 0;

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
                <TableHead className="w-[250px] sm:w-auto">Views</TableHead>
                <TableHead>Last Viewed</TableHead>
                <TableHead className="text-center sm:text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedLinks && processedLinks.length > 0 ? (
                processedLinks
                  .filter((link) => !link.isArchived)
                  .map((link) => (
                    <Collapsible key={link.id} asChild>
                      <>
                        <TableRow key={link.id} className="group/row">
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
                              )}
                            >
                              {/* Progress bar */}
                              {primaryVersion &&
                                !primaryVersion.hasPages &&
                                ["pdf", "slides", "docs", "cad"].includes(
                                  primaryVersion.type!,
                                ) && (
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
                                  onClick={() =>
                                    router.push("/settings/billing")
                                  }
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
                                  title="Copy to clipboard"
                                >
                                  Copy to Clipboard
                                </button>
                              )}
                            </div>
                            <ButtonTooltip content="Preview link">
                              <Button
                                variant={"link"}
                                size={"icon"}
                                className="group h-7 w-8"
                                onClick={() => handlePreviewLink(link)}
                              >
                                <span className="sr-only">Preview link</span>
                                <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                              </Button>
                            </ButtonTooltip>
                            <ButtonTooltip content="Edit link">
                              <Button
                                variant="link"
                                size="icon"
                                className="group h-7 w-8"
                                onClick={() => handleEditLink(link)}
                                title="Edit link"
                              >
                                <span className="sr-only">Edit link</span>
                                <Settings2Icon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                              </Button>
                            </ButtonTooltip>
                          </TableCell>
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
                                <DropdownMenuItem
                                  disabled={!canAddLinks}
                                  onClick={() => handleDuplicateLink(link)}
                                >
                                  <CopyPlusIcon className="mr-2 h-4 w-4" />
                                  Duplicate Link
                                </DropdownMenuItem>
                                {features?.embedding ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedEmbedLink({
                                        id: link.id,
                                        name:
                                          link.name ||
                                          `Link #${link.id.slice(-5)}`,
                                      });
                                      setEmbedModalOpen(true);
                                    }}
                                  >
                                    <Code2Icon className="mr-2 h-4 w-4" />
                                    Get Embed Code
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                  onClick={() =>
                                    handleArchiveLink(
                                      link.id,
                                      link.documentId ?? link.dataroomId ?? "",
                                      link.isArchived,
                                    )
                                  }
                                >
                                  <ArchiveIcon className="mr-2 h-4 w-4" />
                                  Archive
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
                  <TableCell colSpan={5}>
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

        <LinkSheet
          isOpen={isLinkSheetVisible}
          setIsOpen={setIsLinkSheetVisible}
          linkType={`${targetType}_LINK`}
          currentLink={selectedLink.id ? selectedLink : undefined}
          existingLinks={links}
        />

        {selectedEmbedLink && (
          <EmbedCodeModal
            isOpen={embedModalOpen}
            setIsOpen={setEmbedModalOpen}
            linkId={selectedEmbedLink.id}
            linkName={selectedEmbedLink.name}
          />
        )}

        {archivedLinksCount > 0 && (
          <Collapsible asChild>
            <>
              <CollapsibleTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mx-auto mt-4 flex h-8 items-center justify-center gap-x-1 text-gray-400 [&[data-state=open]>svg.chevron]:rotate-180"
                >
                  {archivedLinksCount} Archived Links
                  <ChevronDown className="chevron h-4 w-4 text-gray-400 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div>
                  <h2 className="mb-2 md:mb-4">Archived Links</h2>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[150px] sm:w-[200px] md:w-[250px]">
                          Link
                        </TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Last Viewed</TableHead>
                        <TableHead className="ftext-center sm:text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedLinks &&
                        processedLinks
                          .filter((link) => link.isArchived)
                          .map((link) => (
                            <>
                              <TableRow key={link.id} className="group/row">
                                <TableCell className="w-[180px] truncate">
                                  {link.name || "No link name"}
                                  {link.isNew && !link.isUpdated && (
                                    <Badge
                                      variant="outline"
                                      className="animate-pulse border-transparent bg-emerald-500/15 text-emerald-600 transition-colors hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                      New
                                    </Badge>
                                  )}
                                  {link.isUpdated && (
                                    <Badge
                                      variant="outline"
                                      className="border-blue-500/30 text-blue-500"
                                    >
                                      Updated
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[250px] sm:min-w-[300px] md:min-w-[400px] lg:min-w-[450px]">
                                  <div className="flex items-center gap-x-4 whitespace-nowrap rounded-sm bg-secondary px-3 py-1.5 text-xs text-secondary-foreground sm:py-1 sm:text-sm">
                                    {link.domainId
                                      ? `https://${link.domainSlug}/${link.slug}`
                                      : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1 [&[data-state=open]>svg.chevron]:rotate-180">
                                    <BarChart className="h-4 w-4 text-gray-400" />
                                    <p className="whitespace-nowrap text-sm text-gray-400">
                                      {nFormatter(link._count.views)}
                                      <span className="ml-1 hidden sm:inline-block">
                                        views
                                      </span>
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-400">
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
                                <TableCell className="text-center sm:text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>

                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                        onClick={() =>
                                          handleArchiveLink(
                                            link.id,
                                            link.documentId ??
                                              link.dataroomId ??
                                              "",
                                            link.isArchived,
                                          )
                                        }
                                      >
                                        Reactivate
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            </>
                          ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </>
          </Collapsible>
        )}
      </div>
    </>
  );
}
