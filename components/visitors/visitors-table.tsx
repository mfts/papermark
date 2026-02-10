import Link from "next/link";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { DocumentVersion } from "@prisma/client";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  BadgeCheckIcon,
  BadgeInfoIcon,
  DownloadCloudIcon,
  FileBadgeIcon,
  FileDigitIcon,
  MailIcon,
  MoreHorizontalIcon,
  PlayCircleIcon,
  ServerIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import { useDocumentVisits } from "@/lib/swr/use-document";
import { durationFormat, timeAgo } from "@/lib/utils";

import ChevronDown from "@/components/shared/icons/chevron-down";
import LinkedIn from "@/components/shared/icons/linkedin";
import Twitter from "@/components/shared/icons/twitter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Gauge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimestampTooltip } from "@/components/ui/timestamp-tooltip";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { Pagination } from "../documents/pagination";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { VisitorAvatar } from "./visitor-avatar";
import VisitorChart from "./visitor-chart";
import VisitorClicks from "./visitor-clicks";
import VisitorCustomFields from "./visitor-custom-fields";
import VisitorUserAgent from "./visitor-useragent";
import VisitorUserAgentPlaceholder from "./visitor-useragent-placeholder";
import VisitorVideoChart from "./visitor-video-chart";

const TEST_VIEWER_EMAILS = ["marc@papermark.com", "iuliia@papermark.com"];

// Test viewer profiles with hardcoded display values
const TEST_VIEWER_PROFILES: Record<
  string,
  {
    title: string;
    linkedin: string;
    twitter: string;
    duration: number; // in milliseconds
    completionRate: number; // percentage
  }
> = {
  "marc@papermark.com": {
    title: "Co-Founder of Papermark",
    linkedin: "https://www.linkedin.com/in/marcseitz/",
    twitter: "https://x.com/mfts0",
    duration: 342000, // 5:42 mins
    completionRate: 100,
  },
  "iuliia@papermark.com": {
    title: "Co-Founder of Papermark",
    linkedin: "https://www.linkedin.com/in/iuliia-shnai/",
    twitter: "https://x.com/shnai0",
    duration: 185000, // 3:05 mins
    completionRate: 60,
  },
};

export default function VisitorsTable({
  primaryVersion,
  isVideo = false,
}: {
  primaryVersion: DocumentVersion;
  isVideo?: boolean;
}) {
  const router = useRouter();
  const { id: documentId } = router.query as { id: string };
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const { views, mutate: mutateViews } = useDocumentVisits(
    currentPage,
    pageSize,
  );
  const { plan, isTrial, isPaused } = usePlan();
  const isFreePlan = plan === "free";

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingTestView, setIsCreatingTestView] = useState(false);
  const [isDeletingTestView, setIsDeletingTestView] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [testViewsDeleted, setTestViewsDeleted] = useState(false);

  // Check localStorage on mount to persist "deleted" state across refreshes
  useEffect(() => {
    if (documentId) {
      const deleted = localStorage.getItem(`testViewsDeleted_${documentId}`);
      if (deleted === "true") {
        setTestViewsDeleted(true);
      }
    }
  }, [documentId]);

  // Check if there are any test views
  const hasTestView = views?.viewsWithDuration?.some(
    (view) =>
      view.viewerEmail && TEST_VIEWER_EMAILS.includes(view.viewerEmail),
  );

  // Check if there are any real (non-test) views
  const hasRealViews = views?.viewsWithDuration?.some(
    (view) =>
      !view.viewerEmail || !TEST_VIEWER_EMAILS.includes(view.viewerEmail),
  );

  // Only show test view buttons if there are no real views and test views haven't been deleted
  const showTestViewButton = !hasRealViews && !testViewsDeleted;

  // Check if row should be expanded (all views start closed)
  const isRowExpanded = (viewId: string) => {
    return expandedRows.has(viewId);
  };

  const toggleRowExpanded = (viewId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(viewId)) {
        next.delete(viewId);
      } else {
        next.add(viewId);
      }
      return next;
    });
  };

  const handleCreateTestView = async () => {
    if (!teamId || !documentId) return;

    setIsCreatingTestView(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}/test-view`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create test view");
      }

      toast.success("You got your first views!");
      // Short delay then reload - display values are hardcoded for test viewers
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create test view",
      );
      setIsCreatingTestView(false);
    }
  };

  const handleDeleteTestView = async () => {
    if (!teamId || !documentId) return;

    setIsDeletingTestView(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}/test-view`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete test views");
      }

      toast.success("Test views deleted!");
      // Mark test views as deleted so button disappears permanently
      setTestViewsDeleted(true);
      // Persist to localStorage so it survives page refresh
      localStorage.setItem(`testViewsDeleted_${documentId}`, "true");
      // Refresh the views data
      mutateViews();
    } catch (error) {
      toast.error("Failed to delete test views");
    } finally {
      setIsDeletingTestView(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleArchiveView = async (
    viewId: string,
    targetId: string,
    isArchived: boolean,
  ) => {
    setIsLoading(true);

    const response = await fetch(
      `/api/teams/${teamId}/views/${viewId}/archive`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: !isArchived,
        }),
      },
    );

    if (!response.ok) {
      toast.error("Failed to archive view");
      return;
    }

    // mutate the views on the current page
    mutateViews();
    // mutate the stats
    mutate(
      `/api/teams/${teamId}/documents/${encodeURIComponent(targetId)}/stats`,
    );

    toast.success(
      !isArchived
        ? "View successfully archived"
        : "View successfully unarchived",
    );
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between md:mb-4">
        <h2>All visitors</h2>
        <div>
          {showTestViewButton && (
            <>
              {hasTestView ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteTestView}
                  disabled={isDeletingTestView}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2Icon className="!size-4" />
                  {isDeletingTestView ? "Deleting..." : "Delete test views"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCreateTestView}
                  disabled={isCreatingTestView}
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <PlayCircleIcon className="!size-4" />
                  {isCreatingTestView ? "Creating..." : "Show test views"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>View Duration</TableHead>
              <TableHead>View Completion</TableHead>
              <TableHead>Last Viewed</TableHead>
              <TableHead className="text-center sm:text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views?.viewsWithDuration.length === 0 &&
              views?.hiddenViewCount === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex h-40 w-full items-center justify-center">
                      <p>No views yet. Try sharing a link.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            {views?.hiddenViewCount! > 0 && (
              <>
                <TableRow className="">
                  <TableCell colSpan={5} className="text-left sm:text-center">
                    {isPaused &&
                    views?.hiddenFromPause &&
                    views.hiddenFromPause > 0 ? (
                      // Show pause-specific message if team is paused and has hidden views from pause
                      <div className="flex flex-col items-start justify-center gap-2 sm:flex-row sm:items-center">
                        <span className="flex items-center gap-x-1">
                          <AlertTriangleIcon className="inline-block h-4 w-4 text-orange-500" />
                          {views.hiddenFromPause} visit
                          {views.hiddenFromPause !== 1 ? "s" : ""} occurred
                          after your team was paused and{" "}
                          {views.hiddenFromPause !== 1 ? "are" : "is"}{" "}
                          hidden.{" "}
                        </span>
                        <Link
                          href="/settings/billing"
                          className="font-medium text-orange-600 underline hover:text-orange-700"
                        >
                          Unpause subscription to see all visits
                        </Link>
                      </div>
                    ) : (
                      // Show regular free plan message
                      <div className="flex flex-col items-start justify-center gap-1 sm:flex-row sm:items-center">
                        <span className="flex items-center gap-x-1">
                          <AlertTriangleIcon className="inline-block h-4 w-4 text-yellow-500" />
                          Some older visits may not be shown because your
                          document has more than 20 views.{" "}
                        </span>
                        <UpgradePlanModal
                          clickedPlan={
                            isTrial ? PlanEnum.Business : PlanEnum.Pro
                          }
                          trigger=""
                        >
                          <button className="underline hover:text-gray-800">
                            Upgrade to see full history
                          </button>
                        </UpgradePlanModal>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {Array.from({ length: views?.hiddenViewCount! }).map((_, i) => (
                  <VisitorBlurred key={i} />
                ))}
              </>
            )}
            {views?.viewsWithDuration ? (
              views.viewsWithDuration.map((view) => {
                if (view.isArchived) {
                  return (
                    <TableRow
                      key={view.id}
                      className="group/row opacity-50 grayscale"
                    >
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center overflow-visible sm:space-x-3">
                          <VisitorAvatar
                            viewerEmail={view.viewerEmail}
                            isArchived
                          />
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                                {view.viewerEmail ? (
                                  <>{view.viewerName || view.viewerEmail}</>
                                ) : (
                                  "Anonymous"
                                )}
                              </p>
                              {view.viewerName && view.viewerEmail && (
                                <p className="text-xs text-muted-foreground/60">
                                  {view.viewerEmail}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground/60 sm:text-sm">
                                {view.link && view.link.name
                                  ? view.link.name
                                  : view.linkId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {/* Duration - use hardcoded value for test viewers */}
                      <TableCell className="">
                        <div className="text-sm text-muted-foreground">
                          {durationFormat(
                            view.viewerEmail &&
                              TEST_VIEWER_PROFILES[view.viewerEmail]
                              ? TEST_VIEWER_PROFILES[view.viewerEmail].duration
                              : view.totalDuration,
                          )}
                        </div>
                      </TableCell>
                      {/* Completion - use hardcoded value for test viewers */}
                      <TableCell className="flex justify-start">
                        <div className="text-sm text-muted-foreground">
                          <Gauge
                            value={
                              view.viewerEmail &&
                              TEST_VIEWER_PROFILES[view.viewerEmail]
                                ? TEST_VIEWER_PROFILES[view.viewerEmail]
                                    .completionRate
                                : view.completionRate
                            }
                            size={"small"}
                            showValue={true}
                          />
                        </div>
                      </TableCell>
                      {/* Last Viewed */}
                      <TableCell className="text-sm text-muted-foreground">
                        <TimestampTooltip
                          timestamp={view.viewedAt}
                          side="right"
                          rows={["local", "utc", "unix"]}
                        >
                          <time
                            className="select-none"
                            dateTime={new Date(view.viewedAt).toISOString()}
                          >
                            {timeAgo(view.viewedAt)}
                          </time>
                        </TimestampTooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center sm:text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 group-hover/row:ring-1 group-hover/row:ring-gray-200 group-hover/row:dark:ring-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleArchiveView(
                                  view.id,
                                  view.documentId ?? "",
                                  view.isArchived,
                                );
                              }}
                              disabled={isLoading}
                            >
                              <ArchiveRestoreIcon className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <Collapsible
                    key={view.id}
                    asChild
                    open={isRowExpanded(view.id)}
                    onOpenChange={() => toggleRowExpanded(view.id)}
                  >
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow key={view.id} className="group/row">
                          {/* Name */}
                          <TableCell>
                            <div className="flex items-center overflow-visible sm:space-x-3">
                              <VisitorAvatar viewerEmail={view.viewerEmail} />
                              <div className="min-w-0 flex-1">
                                <div className="focus:outline-none">
                                  <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {view.viewerEmail ? (
                                      <>
                                        {view.viewerName || view.viewerEmail}{" "}
                                        {view.verified &&
                                          (view.viewerEmail &&
                                          TEST_VIEWER_EMAILS.includes(
                                            view.viewerEmail,
                                          ) ? (
                                            <BadgeTooltip
                                              content="Test visitor"
                                              key={`test-${view.id}`}
                                            >
                                              <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                            </BadgeTooltip>
                                          ) : (
                                            <BadgeTooltip
                                              content="Verified visitor"
                                              key={`verified-${view.id}`}
                                            >
                                              <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                            </BadgeTooltip>
                                          ))}
                                        {view.internal && (
                                          <BadgeTooltip
                                            content="Internal visitor"
                                            key={`internal-${view.id}`}
                                          >
                                            <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                                          </BadgeTooltip>
                                        )}
                                        {view.agreementResponse && (
                                          <BadgeTooltip
                                            content={`Agreed to ${view.agreementResponse.agreement.name}`}
                                            key={`agreement-${view.id}`}
                                          >
                                            <FileBadgeIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                          </BadgeTooltip>
                                        )}
                                        {view.downloadedAt && (
                                          <BadgeTooltip
                                            content={`Downloaded ${timeAgo(view.downloadedAt)}`}
                                            key={`download-${view.id}`}
                                          >
                                            <DownloadCloudIcon className="h-4 w-4 text-cyan-500 hover:text-cyan-600" />
                                          </BadgeTooltip>
                                        )}
                                        {view.dataroomId && (
                                          <BadgeTooltip
                                            content={`Dataroom Visitor`}
                                            key={`dataroom-${view.id}`}
                                          >
                                            <ServerIcon className="h-4 w-4 text-[#fb7a00] hover:text-[#fb7a00]/90" />
                                          </BadgeTooltip>
                                        )}
                                        {view.feedbackResponse && (
                                          <BadgeTooltip
                                            content={`${view.feedbackResponse.data.question}: ${view.feedbackResponse.data.answer}`}
                                            key={`feedback-${view.id}`}
                                          >
                                            {view.feedbackResponse.data
                                              .answer === "yes" ? (
                                              <ThumbsUpIcon className="h-4 w-4 text-gray-500 hover:text-gray-600" />
                                            ) : (
                                              <ThumbsDownIcon className="h-4 w-4 text-gray-500 hover:text-gray-600" />
                                            )}
                                          </BadgeTooltip>
                                        )}
                                      </>
                                    ) : (
                                      "Anonymous"
                                    )}
                                  </p>
                                  {view.viewerName && view.viewerEmail && (
                                    <p className="text-xs text-muted-foreground/60">
                                      {view.viewerEmail}
                                    </p>
                                  )}
                                  {/* Show title and social links for test viewers instead of link ID */}
                                  {view.viewerEmail &&
                                  TEST_VIEWER_PROFILES[view.viewerEmail] ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground sm:text-sm">
                                        {
                                          TEST_VIEWER_PROFILES[view.viewerEmail]
                                            .title
                                        }
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={
                                            TEST_VIEWER_PROFILES[
                                              view.viewerEmail
                                            ].linkedin
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-muted-foreground"
                                        >
                                          <LinkedIn className="h-3.5 w-3.5" color={false} />
                                        </a>
                                        <a
                                          href={
                                            TEST_VIEWER_PROFILES[
                                              view.viewerEmail
                                            ].twitter
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-muted-foreground"
                                        >
                                          <Twitter className="h-3.5 w-3.5" />
                                        </a>
                                        <a
                                          href={`mailto:${view.viewerEmail}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-muted-foreground hover:text-emerald-500"
                                        >
                                          <MailIcon className="h-3.5 w-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground/60 sm:text-sm">
                                      {view.link && view.link.name
                                        ? view.link.name
                                        : view.linkId}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {/* Duration - use hardcoded value for test viewers */}
                          <TableCell className="">
                            <div className="text-sm text-muted-foreground">
                              {durationFormat(
                                view.viewerEmail &&
                                  TEST_VIEWER_PROFILES[view.viewerEmail]
                                  ? TEST_VIEWER_PROFILES[view.viewerEmail]
                                      .duration
                                  : view.totalDuration,
                              )}
                            </div>
                          </TableCell>
                          {/* Completion - use hardcoded value for test viewers */}
                          <TableCell className="flex justify-start">
                            <div className="text-sm text-muted-foreground">
                              <Gauge
                                value={
                                  view.viewerEmail &&
                                  TEST_VIEWER_PROFILES[view.viewerEmail]
                                    ? TEST_VIEWER_PROFILES[view.viewerEmail]
                                        .completionRate
                                    : view.completionRate
                                }
                                size={"small"}
                                showValue={true}
                              />
                            </div>
                          </TableCell>
                          {/* Last Viewed */}
                          <TableCell className="text-sm text-muted-foreground">
                            <TimestampTooltip
                              timestamp={view.viewedAt}
                              side="right"
                              rows={["local", "utc", "unix"]}
                            >
                              <time
                                className="select-none"
                                dateTime={new Date(view.viewedAt).toISOString()}
                              >
                                {timeAgo(view.viewedAt)}
                              </time>
                            </TimestampTooltip>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-center sm:text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Expand indicator - shows on hover */}
                              <ChevronDown
                                className={`h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover/row:opacity-100 ${
                                  isRowExpanded(view.id) ? "rotate-180" : ""
                                }`}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 group-hover/row:ring-1 group-hover/row:ring-gray-200 group-hover/row:dark:ring-gray-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleArchiveView(
                                        view.id,
                                        view.documentId ?? "",
                                        view.isArchived,
                                      );
                                    }}
                                    disabled={isLoading}
                                  >
                                    <ArchiveIcon className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>

                      <CollapsibleContent asChild>
                        <>
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={5}>
                              {!isFreePlan && (
                                <VisitorCustomFields
                                  viewId={view.id}
                                  teamId={view.teamId!}
                                  documentId={view.documentId!}
                                />
                              )}
                              {!isFreePlan ? (
                                <VisitorUserAgent viewId={view.id} />
                              ) : (
                                <VisitorUserAgentPlaceholder />
                              )}

                              <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
                                <div className="flex items-center gap-x-1 px-1">
                                  <FileDigitIcon className="size-4" /> Document
                                  Version {view.versionNumber}
                                </div>
                              </div>

                              {isVideo ? (
                                <VisitorVideoChart
                                  documentId={view.documentId!}
                                  viewId={view.id}
                                  teamId={view.teamId!}
                                />
                              ) : (
                                <VisitorChart
                                  documentId={view.documentId!}
                                  viewId={view.id}
                                  totalPages={view.versionNumPages}
                                  versionNumber={view.versionNumber}
                                  downloadType={view.downloadType}
                                  downloadMetadata={
                                    view.downloadMetadata as any
                                  }
                                />
                              )}
                              {(!isFreePlan && primaryVersion.type === "pdf") ||
                              primaryVersion.type === "link" ? (
                                <VisitorClicks
                                  teamId={view.teamId!}
                                  documentId={view.documentId!}
                                  viewId={view.id}
                                />
                              ) : null}
                            </TableCell>
                          </TableRow>
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
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
      <Pagination
        itemName="visits"
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={views?.totalViews || 0}
        totalPages={
          views?.totalViews ? Math.ceil(views.totalViews / pageSize) : 0
        }
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        totalShownItems={
          views?.totalViews
            ? Math.min(
                pageSize,
                views.totalViews - (currentPage - 1) * pageSize,
              )
            : 0
        }
      />
    </div>
  );
}

// create a component for a blurred view of the visitor
const VisitorBlurred = () => {
  return (
    <TableRow className="blur-sm">
      <TableCell className="">
        <div className="flex items-center overflow-visible sm:space-x-3">
          <VisitorAvatar viewerEmail={"abc@example.org"} />
          <div className="min-w-0 flex-1">
            <div className="focus:outline-none">
              <p className="flex items-center gap-x-2 overflow-visible text-sm font-medium text-gray-800 dark:text-gray-200">
                Anonymous
              </p>
              <p className="text-xs text-muted-foreground/60 sm:text-sm">
                Demo link
              </p>
            </div>
          </div>
        </div>
      </TableCell>
      {/* Duration */}
      <TableCell className="">
        <div className="text-sm text-muted-foreground">
          {durationFormat(10000)}
        </div>
      </TableCell>
      {/* Completion */}
      <TableCell className="flex justify-start">
        <div className="text-sm text-muted-foreground">
          <Gauge value={90} size={"small"} showValue={true} />
        </div>
      </TableCell>
      {/* Last Viewed */}
      <TableCell className="text-sm text-muted-foreground">
        <time
          dateTime={new Date(
            new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString()}
        >
          {timeAgo(new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000))}
        </time>
      </TableCell>
      {/* Actions */}
      <TableCell className="cursor-pointer p-0 text-center sm:text-right">
        <div className="flex justify-end space-x-1 p-5 [&[data-state=open]>svg.chevron]:rotate-180">
          <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform duration-200" />
        </div>
      </TableCell>
    </TableRow>
  );
};
