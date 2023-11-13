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

import { useDocumentLinks } from "@/lib/swr/use-document";
import BarChart from "../shared/icons/bar-chart";
import { cn, copyToClipboard, nFormatter, timeAgo } from "@/lib/utils";
import MoreHorizontal from "../shared/icons/more-horizontal";
import { Skeleton } from "../ui/skeleton";
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

export default function LinksTable() {
  const { links } = useDocumentLinks();
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
      name: link.name,
      domain: link.domainSlug,
      slug: link.slug,
      expiresAt: link.expiresAt,
      password: link.password,
      emailProtected: link.emailProtected,
      allowDownload: link.allowDownload ? link.allowDownload : false,
      enableNotification: link.enableNotification
        ? link.enableNotification
        : false,
    });
    //wait for dropdown to close before opening the link sheet
    setTimeout(() => {
      setIsLinkSheetVisible(true);
    }, 0);
  };

  const handleArchiveLink = async (
    linkId: string,
    documentId: string,
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

    // Update the archived link in the list of links
    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        documentId,
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

  return (
    <>
      <div className="w-full sm:p-4">
        <div>
          <h2 className="p-4">All links</h2>
        </div>
        <div className="rounded-md sm:border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium hidden sm:table-cell">
                  Name
                </TableHead>
                <TableHead className="font-medium sm:w-[250px]">Link</TableHead>
                <TableHead className="font-medium">Views</TableHead>
                <TableHead className="font-medium">Last Viewed</TableHead>
                <TableHead className="font-medium text-center sm:text-right"></TableHead>
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
                          <TableCell className="hidden sm:table-cell font-medium truncate w-[220px]">
                            {link.name || "No link name"}{" "}
                            {link.domainId && hasFreePlan ? (
                              <span className="text-foreground bg-destructive ring-1 ring-destructive rounded-full px-2.5 py-0.5 text-xs ml-2">
                                Inactive
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="max-w-[150px] sm:min-w-[450px]">
                            <div
                              className={cn(
                                `group/cell flex items-center gap-x-4 rounded-md text-secondary-foreground px-3 py-1 group-hover/row:ring-1 group-hover/row:ring-gray-400 group-hover/row:dark:ring-gray-100 transition-all`,
                                link.domainId && hasFreePlan
                                  ? "bg-destructive hover:bg-red-700 hover:dark:bg-red-200"
                                  : "bg-secondary hover:bg-emerald-700 hover:dark:bg-emerald-200",
                              )}
                            >
                              <div className="whitespace-nowrap hidden sm:flex text-sm group-hover/cell:hidden">
                                {link.domainId
                                  ? `https://${link.domainSlug}/${link.slug}`
                                  : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${link.id}`}
                              </div>
                              <div className="flex sm:hidden whitespace-nowrap text-sm group-hover/cell:hidden truncate">{`${link.id}`}</div>
                              {link.domainId && hasFreePlan ? (
                                <button
                                  className="whitespace-nowrap text-sm text-center group-hover/cell:text-primary-foreground hidden group-hover/cell:block w-full"
                                  onClick={() =>
                                    router.push("/settings/billing")
                                  }
                                  title="Upgrade to activate link"
                                >
                                  Upgrade{" "}
                                  <span className="hidden sm:inline-flex">
                                    to activate link
                                  </span>
                                </button>
                              ) : (
                                <button
                                  className="whitespace-nowrap text-sm text-center group-hover/cell:text-primary-foreground hidden group-hover/cell:block w-full"
                                  onClick={
                                    link.domainId
                                      ? () =>
                                          handleCopyToClipboard(
                                            `https://${link.domainSlug}/${link.slug}`,
                                          )
                                      : () =>
                                          handleCopyToClipboard(
                                            `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${link.id}`,
                                          )
                                  }
                                  title="Copy to clipboard"
                                >
                                  Copy{" "}
                                  <span className="hidden sm:inline-flex">
                                    to Clipboard
                                  </span>
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center space-x-1 [&[data-state=open]>svg.chevron]:rotate-180">
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                                <p className="whitespace-nowrap text-sm text-muted-foreground">
                                  {nFormatter(link._count.views)}
                                  <span className="ml-1 hidden sm:inline-block">
                                    views
                                  </span>
                                </p>
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 chevron" />
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
                                <DropdownMenuItem
                                  onClick={() => handleEditLink(link)}
                                >
                                  Edit Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                  onClick={() =>
                                    handleArchiveLink(
                                      link.id,
                                      link.documentId,
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
          currentLink={selectedLink}
        />
        {archivedLinksCount > 0 ? (
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
              <CollapsibleContent>
                <div>
                  <h2 className="p-4">Archived Links</h2>
                </div>
                <div className="rounded-md sm:border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-medium hidden sm:table-cell">
                          Name
                        </TableHead>
                        <TableHead className="font-medium sm:w-[250px]">
                          Link
                        </TableHead>
                        <TableHead className="font-medium">Views</TableHead>
                        <TableHead className="font-medium">
                          Last Viewed
                        </TableHead>
                        <TableHead className="font-medium text-center sm:text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links
                        ? links
                            .filter((link) => link.isArchived)
                            .map((link) => (
                              <>
                                <TableRow key={link.id} className="group/row">
                                  <TableCell className="hidden sm:table-cell truncate w-[220px]">
                                    {link.name || "No link name"}
                                  </TableCell>
                                  <TableCell className="max-w-[150px] sm:min-w-[450px]">
                                    <div className="flex items-center gap-x-4 rounded-md text-secondary-foreground bg-secondary group-hover/row:ring-1 group-hover/row:ring-gray-400 group-hover/row:dark:ring-gray-100 px-3 py-1">
                                      <div className="whitespace-nowrap hidden sm:flex text-sm">
                                        {link.domainId
                                          ? `https://${link.domainSlug}/${link.slug}`
                                          : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${link.id}`}
                                      </div>
                                      <div className="flex sm:hidden whitespace-nowrap text-sm truncate">{`${link.id}`}</div>
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
                                              link.documentId,
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
                            ))
                        : null}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </>
          </Collapsible>
        ) : null}
      </div>
    </>
  );
}
