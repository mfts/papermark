import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { PlusIcon } from "lucide-react";

import { usePlan } from "@/lib/swr/use-billing";
import useDataroomTemplates from "@/lib/swr/use-dataroom-templates";
import useDatarooms from "@/lib/swr/use-datarooms";
import useLimits from "@/lib/swr/use-limits";
import { daysLeft } from "@/lib/utils";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { AddDataroomModal } from "@/components/datarooms/add-dataroom-modal";
import { DataroomTrialModal } from "@/components/datarooms/dataroom-trial-modal";
import { EmptyDataroom } from "@/components/datarooms/empty-dataroom";
import { TemplateCard } from "@/components/datarooms/template-card";
import { UseTemplateModal } from "@/components/datarooms/use-template-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DataroomsPage() {
  const { datarooms } = useDatarooms();
  const { templates, loading: templatesLoading } = useDataroomTemplates();
  const { isFree, isPro, isBusiness, isDatarooms, isDataroomsPlus, isTrial } =
    usePlan();
  const { limits } = useLimits();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-datarooms");

  const numDatarooms = datarooms?.length ?? 0;
  const limitDatarooms = limits?.datarooms ?? 1;

  const canCreateUnlimitedDatarooms =
    isDatarooms ||
    isDataroomsPlus ||
    (isBusiness && numDatarooms < limitDatarooms);

  useEffect(() => {
    if (!isTrial && (isFree || isPro)) router.push("/documents");
  }, [isTrial, isFree, isPro]);

  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:px-4 sm:py-4">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Datarooms
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage your datarooms and explore templates
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            {(isBusiness || isDatarooms || isDataroomsPlus) && (
              <UseTemplateModal>
                <Button
                  variant="outline"
                  className="flex cursor-pointer items-center gap-x-2"
                  title="Use Template"
                >
                  <span>Use Template</span>
                </Button>
              </UseTemplateModal>
            )}
            {isBusiness && !canCreateUnlimitedDatarooms ? (
              <UpgradePlanModal
                clickedPlan={PlanEnum.DataRooms}
                trigger="datarooms"
              >
                <Button
                  className="group flex flex-1 items-center justify-start gap-x-3 px-3 text-left"
                  title="Upgrade to Add Data Room"
                >
                  <span>Upgrade to Add Data Room</span>
                </Button>
              </UpgradePlanModal>
            ) : isTrial &&
              datarooms &&
              !isBusiness &&
              !isDatarooms &&
              !isDataroomsPlus ? (
              <div className="flex items-center gap-x-4">
                <div className="text-sm text-destructive">
                  <span>Dataroom Trial: </span>
                  <span className="font-medium">
                    {daysLeft(new Date(datarooms[0].createdAt), 7)} days left
                  </span>
                </div>
                <UpgradePlanModal
                  clickedPlan={PlanEnum.DataRooms}
                  trigger="datarooms"
                >
                  <Button
                    className="group flex flex-1 items-center justify-start gap-x-3 px-3 text-left"
                    title="Upgrade to Add Data Room"
                  >
                    <span>Upgrade to Add Data Room</span>
                  </Button>
                </UpgradePlanModal>
              </div>
            ) : isBusiness || isDatarooms || isDataroomsPlus ? (
              <AddDataroomModal>
                <Button
                  className="group flex flex-1 items-center justify-start gap-x-3 px-3 text-left"
                  title="Create New Dataroom"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Create New Dataroom</span>
                </Button>
              </AddDataroomModal>
            ) : (
              <DataroomTrialModal>
                <Button
                  className="group flex flex-1 items-center justify-start gap-x-3 px-3 text-left"
                  title="Start Data Room Trial"
                >
                  <span>Start Data Room Trial</span>
                </Button>
              </DataroomTrialModal>
            )}
          </div>
        </section>

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-datarooms">My Datarooms</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="my-datarooms" className="space-y-4">
            <ul className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
              {datarooms &&
                datarooms.map((dataroom) => (
                  <Link
                    key={dataroom.id}
                    href={`/datarooms/${dataroom.id}/documents`}
                  >
                    <Card className="group relative overflow-hidden duration-500 hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="truncate">
                            {dataroom.name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <dl className="divide-y divide-gray-100 text-sm leading-6">
                          <div className="flex justify-between gap-x-4 py-3">
                            <dt className="text-gray-500 dark:text-gray-400">
                              Documents
                            </dt>
                            <dd className="flex items-start gap-x-2">
                              <div className="font-medium text-gray-900 dark:text-gray-200">
                                {dataroom._count.documents ?? 0}
                              </div>
                            </dd>
                          </div>
                          <div className="flex justify-between gap-x-4 py-3">
                            <dt className="text-gray-500 dark:text-gray-400">
                              Views
                            </dt>
                            <dd className="flex items-start gap-x-2">
                              <div className="font-medium text-gray-900 dark:text-gray-200">
                                {dataroom._count.views ?? 0}
                              </div>
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </ul>

            {datarooms && datarooms.length === 0 && (
              <div className="flex items-center justify-center">
                <EmptyDataroom />
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Available Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Start with pre-built dataroom structures and content
                </p>
              </div>
            </div>

            {templatesLoading ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-24 bg-muted" />
                    <CardHeader>
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-12 rounded bg-muted" />
                          <div className="h-12 rounded bg-muted" />
                        </div>
                        <div className="h-9 rounded bg-muted" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}

            {!templatesLoading && templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <h3 className="mb-2 text-lg font-medium">
                  No Templates Available
                </h3>
                <p className="max-w-md text-center text-sm text-muted-foreground">
                  Templates are currently being prepared. Check back soon for
                  pre-built dataroom structures.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
}
