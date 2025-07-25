import { useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { ChartNoAxesColumnIcon, LogsIcon } from "lucide-react";

import { usePlan } from "@/lib/swr/use-billing";
import { useDataroom } from "@/lib/swr/use-dataroom";

import DataroomAnalyticsOverview from "@/components/datarooms/analytics/analytics-overview";
import DocumentAnalyticsTree from "@/components/datarooms/analytics/document-analytics-tree";
import MockAnalyticsTable from "@/components/datarooms/analytics/mock-analytics-table";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import StatsCard from "@/components/datarooms/stats-card";
import AppLayout from "@/components/layouts/app";
import { FeaturePreview } from "@/components/ui/feature-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataroomVisitorsTable from "@/components/visitors/dataroom-visitors-table";

export default function DataroomAnalyticsPage() {
  const { dataroom } = useDataroom();
  const { isDatarooms, isDataroomsPlus, isTrial } = usePlan();

  // State for the selected document
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Determine default tab based on plan
  const defaultTab =
    isTrial || isDatarooms || isDataroomsPlus ? "analytics" : "audit-log";
  // Check if user has access to analytics features
  const hasAnalyticsAccess = isDatarooms || isDataroomsPlus || isTrial;

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  const AnalyticsContent = () => (
    <>
      <DataroomAnalyticsOverview
        selectedDocument={selectedDocument}
        setSelectedDocument={setSelectedDocument}
      />
      <div>
        <h3 className="mb-4 text-lg font-medium">
          Dataroom Analytics{" "}
          {selectedDocument &&
            `- Showing detailed metrics for "${selectedDocument.name}"`}
        </h3>
        <DocumentAnalyticsTree
          dataroomId={dataroom.id}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
        />
      </div>
    </>
  );

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

        <div className="space-y-8">
          <StatsCard />

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2"
              >
                <ChartNoAxesColumnIcon className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="audit-log"
                className="flex items-center gap-2"
              >
                <LogsIcon className="h-4 w-4" />
                Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
              {hasAnalyticsAccess ? (
                <AnalyticsContent />
              ) : (
                <FeaturePreview
                  title="Advanced Dataroom Analytics"
                  description="Get detailed insights into document engagement, completion rates, and visitor behavior patterns across your dataroom."
                  requiredPlan={PlanEnum.DataRooms}
                  trigger="dataroom_analytics_tab"
                  upgradeButtonText="Data Rooms"
                >
                  <MockAnalyticsTable />
                </FeaturePreview>
              )}
            </TabsContent>

            <TabsContent value="audit-log">
              <DataroomVisitorsTable dataroomId={dataroom.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
