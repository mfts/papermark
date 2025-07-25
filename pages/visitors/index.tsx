import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { BadgeInfoIcon, UserCheckIcon, UsersIcon } from "lucide-react";
import { useQueryState } from "nuqs";

import useAllowListGroups from "@/lib/swr/use-allow-list-groups";
import { usePlan } from "@/lib/swr/use-billing";
import useViewers from "@/lib/swr/use-viewers";

import { Pagination } from "@/components/documents/pagination";
import AppLayout from "@/components/layouts/app";
import { SearchBoxPersisted } from "@/components/search-box";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeTooltip } from "@/components/ui/tooltip";
import AllowListGroupsSection from "@/components/visitors/allow-list-groups-section";
import { ContactsTable } from "@/components/visitors/contacts-table";
import CreateGroupButton from "@/components/visitors/create-group-button";

export default function Visitors() {
  const router = useRouter();
  const { isFree, isTrial } = usePlan();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("lastViewed");
  const [sortOrder, setSortOrder] = useState("desc");

  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "all-visitors",
    clearOnDefault: true,
  });

  const { viewers, pagination, isValidating } = useViewers(
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
  );

  const [allowListPage, setAllowListPage] = useState(1);
  const [allowListLimit, setAllowListLimit] = useState(10);
  const {
    allowListGroups,
    pagination: allowListPagination,
    loading: allowListLoading,
  } = useAllowListGroups(
    allowListPage,
    allowListLimit,
    router.query.search as string,
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

  const handleAllowListPageChange = (page: number) => {
    setAllowListPage(page);
  };

  const handleAllowListLimitChange = (limit: number) => {
    setAllowListLimit(limit);
    setAllowListPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
    setAllowListPage(1);
  }, [router.query.search]);

  useEffect(() => {
    if (isFree && !isTrial) router.push("/documents");
  }, [isTrial, isFree]);

  return (
    <AppLayout>
      <div className="p-4 pb-0 sm:m-4 sm:py-4">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-3xl">
              Visitor Management
            </h2>
            <p className="text-base text-muted-foreground sm:text-base">
              Manage and monitor all your visitors
            </p>
          </div>
        </section>
        <div className="flex w-full flex-col gap-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="mb-4 flex w-full items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger
                  value="all-visitors"
                  className="flex items-center gap-2"
                >
                  <UsersIcon className="h-4 w-4" />
                  All Visitors
                </TabsTrigger>
                <TabsTrigger
                  value="allow-lists"
                  className="flex items-center gap-2"
                >
                  <UserCheckIcon className="h-4 w-4" />
                  Allow Lists/Groups
                </TabsTrigger>
                {/* <TabsTrigger value="access-requests" className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Access Requests
                </TabsTrigger> */}
              </TabsList>
              <div className="relative ml-auto w-full max-w-xs">
                <SearchBoxPersisted
                  loading={isValidating}
                  placeholder={
                    tab === "all-visitors"
                      ? "Search visitors..."
                      : "Search allow lists/groups..."
                  }
                  inputClassName="h-10"
                />
              </div>
            </div>
            <TabsContent value="all-visitors">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">All visitors</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    See all your visitors in one place.
                  </p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4 bg-gray-200 dark:bg-gray-800" />
                  <ContactsTable
                    viewers={viewers}
                    pagination={pagination}
                    sorting={{ sortBy, sortOrder }}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onSortChange={handleSortChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="allow-lists">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Groups of Allowed Emails and Domains
                    </h3>
                    <div className="flex flex-row items-center justify-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Pre-defined lists of emails and domains that are allowed
                        to access your documents and datarooms.
                      </p>
                      <BadgeTooltip
                        content="Link creation option: Allow specified viewers to choose this predefined list of emails and domains"
                        key="allow-list-info"
                      >
                        <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                      </BadgeTooltip>
                    </div>
                  </div>
                  <CreateGroupButton />
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4 bg-gray-200 dark:bg-gray-800" />
                  <AllowListGroupsSection
                    groups={allowListGroups}
                    loading={allowListLoading}
                    searchQuery={router.query.search as string}
                  />
                  {allowListPagination && allowListGroups && (
                    <Pagination
                      currentPage={allowListPagination.page}
                      pageSize={allowListPagination.limit}
                      totalItems={allowListPagination.total}
                      totalPages={allowListPagination.totalPages}
                      onPageChange={handleAllowListPageChange}
                      onPageSizeChange={handleAllowListLimitChange}
                      totalShownItems={allowListGroups.length}
                      itemName="groups"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* <TabsContent value="access-requests">
              <Card>
                <CardHeader>
                  <h3 className="mb-2 text-lg font-semibold">Access Requests</h3>
                  <p className="text-muted-foreground">Review and manage pending visitor access requests.</p>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </TabsContent> */}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
