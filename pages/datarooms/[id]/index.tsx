import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryState } from "nuqs";

import { useDataroom, useDataroomLinks } from "@/lib/swr/use-dataroom";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import StatsCard from "@/components/datarooms/stats-card";
import { Pagination } from "@/components/documents/pagination";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import DataroomVisitorsTable from "@/components/visitors/dataroom-visitors-table";

export default function DataroomPage() {
  const { dataroom } = useDataroom();
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

  const { links, pagination, loading, isValidating } = useDataroomLinks(
    currentPage,
    pageSize,
    searchQuery || undefined,
    tags || undefined,
  );

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const linksSectionRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (searchQuery || tags) {
      setCurrentPage(1);
    }
  }, [searchQuery, tags]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    shouldScrollRef.current = true;
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    shouldScrollRef.current = true;
    setCurrentPage(page);
  }, []);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[
              <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
                Share
              </Button>,
            ]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        <div className="space-y-4">
          {/* Stats */}
          <StatsCard />

          {/* Links */}
          <div className="space-y-4" ref={linksSectionRef}>
            <div className="flex items-center gap-4">
              <SearchBoxPersisted
                loading={isValidating}
                inputClassName="h-10"
                placeholder="Search links..."
              />
            </div>
            <LinksTable
              links={links}
              targetType={"DATAROOM"}
              loading={isValidating}
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
          <DataroomVisitorsTable dataroomId={dataroom.id} />

          <LinkSheet
            linkType={"DATAROOM_LINK"}
            isOpen={isLinkSheetOpen}
            setIsOpen={setIsLinkSheetOpen}
            existingLinks={links}
          />
        </div>
      </div>
    </AppLayout>
  );
}
