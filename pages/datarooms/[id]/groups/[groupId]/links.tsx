import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryState } from "nuqs";

import { useDataroom } from "@/lib/swr/use-dataroom";
import {
  useDataroomGroup,
  useDataroomGroupLinks,
} from "@/lib/swr/use-dataroom-groups";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import { GroupHeader } from "@/components/datarooms/groups/group-header";
import { GroupNavigation } from "@/components/datarooms/groups/group-navigation";
import { Pagination } from "@/components/documents/pagination";
import AppLayout from "@/components/layouts/app";
import LinksTable from "@/components/links/links-table";
import { SearchBoxPersisted } from "@/components/search-box";

export default function DataroomGroupLinksPage() {
  const { dataroom } = useDataroom();
  const { viewerGroup } = useDataroomGroup();
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

  const {
    links,
    pagination,
    loading: isValidating,
  } = useDataroomGroupLinks(
    currentPage,
    pageSize,
    searchQuery || undefined,
    tags || undefined,
  );

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

  if (!dataroom || !viewerGroup) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        <GroupHeader dataroomId={dataroom.id} groupName={viewerGroup.name} />
        <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <GroupNavigation
            dataroomId={dataroom.id}
            viewerGroupId={viewerGroup.id}
          />
          <div className="grid gap-6">
            <div className="space-y-4" ref={linksSectionRef}>
              <div className="flex items-center gap-4">
                <SearchBoxPersisted
                  loading={isValidating}
                  inputClassName="h-10"
                  placeholder="Search links..."
                />
              </div>
              <LinksTable links={links} targetType={"DATAROOM"} />
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
