import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { ArchiveIcon, LayoutGridIcon, PlusIcon, Rows3Icon } from "lucide-react";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { AddDataroomModal } from "@/components/datarooms/add-dataroom-modal";
import { DataroomTrialModal } from "@/components/datarooms/dataroom-trial-modal";
import { EmptyDataroom } from "@/components/datarooms/empty-dataroom";
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

import { usePlan } from "@/lib/swr/use-billing";
import useDatarooms from "@/lib/swr/use-datarooms";
import useLimits from "@/lib/swr/use-limits";
import { cn, daysLeft } from "@/lib/utils";

export default function DataroomsPage() {
  const [viewType, setViewType] = useState<"grid" | "rows">("grid");
  const { datarooms } = useDatarooms();
  const { isFree, isPro, isBusiness, isDatarooms, isDataroomsPlus, isTrial } =
    usePlan();
  const { limits } = useLimits();
  const router = useRouter();

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
        <div className="flex w-full flex-col items-center pb-2">
          <section className="flex w-full items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Datarooms
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Manage your datarooms
              </p>
            </div>
            <div className="flex items-center gap-x-1">
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
                    title="Create New Document"
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
          <div className="flex w-full items-center justify-end gap-x-2">
            <Button
              variant={viewType === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("grid")}
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === "rows" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("rows")}
            >
              <Rows3Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-4">
          <ul
            className={cn(
              "grid gap-x-6 gap-y-8",
              viewType === "grid"
                ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1 gap-y-3",
            )}
          >
            {datarooms &&
              datarooms.map((dataroom) => (
                <Link
                  key={dataroom.id}
                  href={`/datarooms/${dataroom.id}/documents`}
                >
                  <Card
                    className={cn(
                      "group relative overflow-hidden duration-500 hover:border-primary/50",
                      viewType === "rows" && "flex flex-row items-center",
                    )}
                  >
                    <CardHeader className={cn(viewType === "rows" && "flex-1")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                          <CardTitle
                            className={cn(
                              "truncate",
                              dataroom.isArchived && "text-muted-foreground",
                            )}
                          >
                            {dataroom.name}
                          </CardTitle>
                          {dataroom.isArchived && (
                            <span className="flex items-center gap-x-1 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                              <ArchiveIcon className="h-4 w-4" />
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent
                      className={cn(
                        viewType === "rows" &&
                          "flex flex-1 justify-end px-6 py-0",
                      )}
                    >
                      <dl
                        className={cn(
                          "divide-y divide-gray-100 text-sm leading-6",
                          viewType === "rows" && "flex divide-x divide-y-0",
                        )}
                      >
                        <div
                          className={cn(
                            "flex justify-between gap-x-4 py-3",
                            viewType === "rows" && "px-3",
                          )}
                        >
                          <dt className="text-gray-500 dark:text-gray-400">
                            Documents
                          </dt>
                          <dd className="flex items-start gap-x-2">
                            <div className="font-medium text-gray-900 dark:text-gray-200">
                              {dataroom._count.documents ?? 0}
                            </div>
                          </dd>
                        </div>
                        <div
                          className={cn(
                            "flex justify-between gap-x-4 py-3",
                            viewType === "rows" && "px-3",
                          )}
                        >
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
        </div>
      </main>
    </AppLayout>
  );
}
