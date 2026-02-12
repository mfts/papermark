import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Download } from "lucide-react";

import { usePlan } from "@/lib/swr/use-billing";
import useViewers from "@/lib/swr/use-viewers";

import AppLayout from "@/components/layouts/app";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ContactsTable } from "@/components/visitors/contacts-table";
import { ExportVisitorsModal } from "@/components/visitors/export-visitors-modal";

export default function Visitors() {
  const router = useRouter();
  const teamInfo = useTeam();
  const { isFree, isTrial } = usePlan();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("lastViewed");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showExportModal, setShowExportModal] = useState(false);

  const { viewers, pagination, isValidating } = useViewers(
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [router.query.search]);

  useEffect(() => {
    if (isFree && !isTrial) router.push("/documents");
  }, [isTrial, isFree]);

  return (
    <AppLayout>
      <div className="p-4 pb-0 sm:m-4 sm:py-4">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              All visitors
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              See all your visitors in one place.
            </p>
          </div>
        </section>

        <div className="mb-2 flex justify-end gap-x-2">
          <div className="relative w-full sm:max-w-xs">
            <SearchBoxPersisted
              loading={isValidating}
              placeholder="Search visitors..."
              inputClassName="h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="h-10"
          >
            <Download className="!size-4" />
            Export
          </Button>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="relative p-4 pt-0 sm:mx-4 sm:mt-4">
        <ContactsTable
          viewers={viewers}
          pagination={pagination}
          sorting={{ sortBy, sortOrder }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Export Modal */}
      {showExportModal && teamInfo?.currentTeam?.id && (
        <ExportVisitorsModal
          teamId={teamInfo.currentTeam.id}
          teamName={teamInfo.currentTeam.name}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </AppLayout>
  );
}