import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import BarChart from "../shared/icons/bar-chart";
import { cn, copyToClipboard, nFormatter, timeAgo } from "@/lib/utils";
import MoreHorizontal from "../shared/icons/more-horizontal";
import LinksVisitors from "./links-visitors";
import ChevronDown from "../shared/icons/chevron-down";
import LinkSheet, {
  DEFAULT_LINK_PROPS,
  type DEFAULT_LINK_TYPE,
} from "./link-sheet";
import { useState } from "react";
import { LinkWithViews } from "@/lib/types";
import { mutate } from "swr";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { usePlan } from "@/lib/swr/use-billing";
import { useTeam } from "@/context/team-context";
import ProcessStatusBar from "../documents/process-status-bar";
import { Settings2Icon } from "lucide-react";
import { DocumentVersion } from "@prisma/client";

export default function LinksTable({
  targetType,
  links,
  primaryVersion,
}: {
  targetType: "DOCUMENT" | "DATAROOM";
  links?: LinkWithViews[];
  primaryVersion?: DocumentVersion;
}) {
  const router = useRouter();
  const { plan } = usePlan();
  const teamInfo = useTeam();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLinkSheetVisible, setIsLinkSheetVisible] = useState<boolean>(false);
  const [selectedLink, setSelectedLink] =
    useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);

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
    });
    //wait for dropdown to close before opening the link sheet
    setTimeout(() => {
      setIsLinkSheetVisible(true);
    }, 0);
  };

  const handleArchiveLink = async (
    linkId: string,
    targetId: string,
    isArchived: boolean,
  ) => {
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

  const hasFreePlan = plan && plan.plan === "free";

  console.log("links", links);

  return (
    <>
      <div className="w-full">
        <div>
          <h2 className="mb-2 md:mb-4">All links</h2>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent *:whitespace-nowrap *:font-medium">
                <TableHead>Name</TableHead>
                <TableHead className="w-[150px] sm:w-[200px] md:w-[250px]">
                  Link
                </TableHead>
                <TableHead className="w-[250px] sm:w-auto">Views</TableHead>
                <TableHead>Last Viewed</TableHead>
                <TableHead className="ftext-center sm:text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links ? (
                links
                  .filter((link) => !link.isArchived)
                  .map((link) => (
                    <Collapsible key={link.id} asChild>
                      <>
                        <TableRow key={link.id} className="group/row">
                          <TableCell className="font-medium truncate w-[220px]">
                            {link.name || `Link #${link.id.slice(-5)}`}{" "}
                            {link.domainId && hasFreePlan ? (
                              <span className="text-foreground bg-destructive ring-1 ring-destructive rounded-full px-2.5 py-0.5 text-xs ml-2">
                                Inactive
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="max-w-[250px] sm:min-w-[300px] md:min-w-[400px] lg:min-w-[450px] flex items-center gap-x-2">
                            <div
                              className={cn(
                                `group/cell relative w-full overflow-hidden flex items-center gap-x-4 rounded-sm text-secondary-foreground text-center px-3 py-1.5 md:py-1 group-hover/row:ring-1 group-hover/row:ring-gray-400 group-hover/row:dark:ring-gray-100 transition-all truncate`,
                                link.domainId && hasFreePlan
                                  ? "bg-destructive hover:bg-red-700 hover:dark:bg-red-200"
                                  : "bg-secondary hover:bg-emerald-700 hover:dark:bg-emerald-200",
                              )}
                            >
                              {/* Progress bar */}
                              {primaryVersion &&
                              primaryVersion.type !== "notion" &&
                              !primaryVersion.hasPages ? (
                                <ProcessStatusBar
                                  documentVersionId={primaryVersion.id}
                                  className="absolute z-20 top-0 left-0 right-0 bottom-0 h-full gap-x-8 flex items-center"
                                />
                              ) : null}

                              <div className="whitespace-nowrap w-full flex text-xs md:text-sm group-hover/cell:opacity-0">
                                {link.domainId
                                  ? `https://${link.domainSlug}/${link.slug}`
                                  : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${targetType === "DATAROOM" ? `d/` : ``}${link.id}`}
                              </div>

                              {link.domainId && hasFreePlan ? (
                                <button
                                  className="whitespace-nowrap text-sm text-center group-hover/cell:text-primary-foreground hidden group-hover/cell:block w-full absolute top-0 left-0 right-0 bottom-0 z-10"
                                  onClick={() =>
                                    router.push("/settings/billing")
                                  }
                                  title="Upgrade to activate link"
                                >
                                  Upgrade to activate link
                                </button>
                              ) : (
                                <button
                                  className="whitespace-nowrap w-full text-xs sm:text-sm text-center group-hover/cell:text-primary-foreground hidden group-hover/cell:block absolute top-0 left-0 right-0 bottom-0 z-10"
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      link.domainId
                                        ? `https://${link.domainSlug}/${link.slug}`
                                        : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${targetType === "DATAROOM" ? `d/` : ``}${link.id}`,
                                    )
                                  }
                                  title="Copy to clipboard"
                                >
                                  Copy to Clipboard
                                </button>
                              )}
                            </div>
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
                                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 chevron" />
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
                                <Button variant="ghost" className="h-8 w-8 p-0">
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
                                  Edit Link
                                </DropdownMenuItem>
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

        <LinkSheet
          isOpen={isLinkSheetVisible}
          setIsOpen={setIsLinkSheetVisible}
          linkType={`${targetType}_LINK`}
          currentLink={selectedLink}
          existingLinks={links}
        />

        {archivedLinksCount > 0 && (
          <Collapsible asChild>
            <>
              <CollapsibleTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-gray-400 mx-auto flex items-center gap-x-1 h-8 justify-center mt-4 [&[data-state=open]>svg.chevron]:rotate-180"
                >
                  {archivedLinksCount} Archived Links
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 chevron" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div>
                  <h2 className="mb-2 md:mb-4">Archived Links</h2>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent *:whitespace-nowrap *:font-medium">
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
                      {links &&
                        links
                          .filter((link) => link.isArchived)
                          .map((link) => (
                            <>
                              <TableRow key={link.id} className="group/row">
                                <TableCell className="truncate w-[180px]">
                                  {link.name || "No link name"}
                                </TableCell>
                                <TableCell className="max-w-[250px] sm:min-w-[300px] md:min-w-[400px] lg:min-w-[450px]">
                                  <div className="flex items-center gap-x-4 whitespace-nowrap text-xs sm:text-sm rounded-sm text-secondary-foreground bg-secondary px-3 py-1.5 sm:py-1">
                                    {link.domainId
                                      ? `https://${link.domainSlug}/${link.slug}`
                                      : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${link.id}`}
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
