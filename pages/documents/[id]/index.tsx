import ErrorPage from "next/error";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { useQueryState } from "nuqs";

import { useDocument, useDocumentLinks } from "@/lib/swr/use-document";
import useLimits from "@/lib/swr/use-limits";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import DocumentHeader from "@/components/documents/document-header";
import { Pagination } from "@/components/documents/pagination";
import { StatsComponent } from "@/components/documents/stats";
import VideoAnalytics from "@/components/documents/video-analytics";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import VisitorsTable from "@/components/visitors/visitors-table";

export default function DocumentPage() {
  const {
    document: prismaDocument,
    primaryVersion,
    error,
    mutate: mutateDocument,
  } = useDocument();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery] = useQueryState<string | null>("search", {
    parse: (value: string) => value || null,
    serialize: (value: string | null) => value || "",
  });
  const [tags] = useQueryState<string[]>("tags", {
    parse: (value: string) => value.split(",").filter(Boolean),
    serialize: (value: string[]) => value.join(","),
  });

  useEffect(() => {
    if (searchQuery || tags) {
      setCurrentPage(1);
    }
  }, [searchQuery, tags]);

  const { links, pagination, isValidating } = useDocumentLinks(
    currentPage,
    pageSize,
    searchQuery || undefined,
    tags || undefined,
  );
  const teamInfo = useTeam();

  const { canAddLinks } = useLimits();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const linksSectionRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  // TODO: scroll to Title H2
  // const scrollToLinks = useCallback(() => {
  //   if (linksSectionRef.current && shouldScrollRef.current) {
  //     linksSectionRef.current.scrollIntoView({
  //       behavior: "smooth",
  //       block: "start",
  //     });
  //     shouldScrollRef.current = false;
  //   }
  // }, []);

  // TODO: scroll to Title H2
  // useEffect(() => {
  //   if (!isValidating && shouldScrollRef.current) {
  //     scrollToLinks();
  //   }
  // }, [isValidating, scrollToLinks]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    shouldScrollRef.current = true;
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    shouldScrollRef.current = true;
    setCurrentPage(page);
  }, []);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (error && error.status === 400) {
    return <ErrorPage statusCode={400} />;
  }

  const AddLinkButton = () => {
    if (!canAddLinks) {
      return (
        <UpgradePlanModal clickedPlan={PlanEnum.Pro} trigger={"limit_add_link"}>
          <Button className="flex h-8 whitespace-nowrap text-xs lg:h-9 lg:text-sm">
            Upgrade to Create Link
          </Button>
        </UpgradePlanModal>
      );
    } else {
      return (
        <Button
          className="flex h-8 whitespace-nowrap text-xs lg:h-9 lg:text-sm"
          onClick={() => setIsLinkSheetOpen(true)}
        >
          Create Link
        </Button>
      );
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        {prismaDocument && primaryVersion ? (
          <>
            {/* Action Header */}
            <DocumentHeader
              primaryVersion={primaryVersion}
              prismaDocument={prismaDocument}
              teamId={teamInfo?.currentTeam?.id!}
              actions={[<AddLinkButton key={"create-link"} />]}
            />

            {/* Document Analytics */}
            {primaryVersion.type !== "video" && (
              <StatsComponent
                documentId={prismaDocument.id}
                numPages={primaryVersion.numPages!}
              />
            )}

            {/* Video Analytics */}
            {primaryVersion.type === "video" && (
              <VideoAnalytics
                documentId={prismaDocument.id}
                primaryVersion={primaryVersion}
                teamId={teamInfo?.currentTeam?.id!}
              />
            )}

            {/* Links */}
            <div className="space-y-4 pt-2" ref={linksSectionRef}>
              <div className="flex items-center gap-4">
                <SearchBoxPersisted
                  loading={isValidating}
                  inputClassName="h-10"
                  placeholder="Search links..."
                />
              </div>
              <LinksTable
                links={links}
                targetType={"DOCUMENT"}
                primaryVersion={primaryVersion}
                mutateDocument={mutateDocument}
              />
              {pagination && pagination.total > 0 && (
                <div className="mt-4 flex w-full justify-center">
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    className="w-full"
                    totalItems={pagination.total}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    totalShownItems={links?.length || 0}
                    itemName="links"
                  />
                </div>
              )}
            </div>

            {/* Visitors */}
            <VisitorsTable
              primaryVersion={primaryVersion}
              isVideo={primaryVersion.type === "video"}
            />

            <LinkSheet
              isOpen={isLinkSheetOpen}
              linkType="DOCUMENT_LINK"
              setIsOpen={setIsLinkSheetOpen}
              existingLinks={links}
            />
          </>
        ) : (
          <div className="flex h-screen items-center justify-center">
            <LoadingSpinner className="mr-1 h-20 w-20" />
          </div>
        )}
      </main>
    </AppLayout>
  );
}