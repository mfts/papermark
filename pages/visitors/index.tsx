import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { usePlan } from "@/lib/swr/use-billing";
import useViewers from "@/lib/swr/use-viewers";

import AppLayout from "@/components/layouts/app";
import { SearchBoxPersisted } from "@/components/search-box";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/visitors/contacts-table";
import { VisitorGroupsSection } from "@/components/visitors/visitor-groups-section";

export default function Visitors() {
  const router = useRouter();
  const { isFree, isTrial } = usePlan();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("lastViewed");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState(
    (router.query.tab as string) || "visitors",
  );

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

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query.tab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(
      { pathname: router.pathname, query: { ...router.query, tab: value } },
      undefined,
      { shallow: true },
    );
  };

  return (
    <AppLayout>
      <div className="p-4 pb-0 sm:m-4 sm:py-4">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              All visitors
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              See all your visitors and manage visitor groups.
            </p>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="groups">Visitor Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="visitors">
            <div className="mb-2 flex justify-end gap-x-2">
              <div className="relative w-full sm:max-w-xs">
                <SearchBoxPersisted
                  loading={isValidating}
                  placeholder="Search visitors..."
                  inputClassName="h-10"
                />
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-800" />

            <div className="relative pt-4">
              <ContactsTable
                viewers={viewers}
                pagination={pagination}
                sorting={{ sortBy, sortOrder }}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSortChange={handleSortChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="groups">
            <VisitorGroupsSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}