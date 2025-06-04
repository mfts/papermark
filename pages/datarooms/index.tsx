import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { Pin, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { usePins } from "@/lib/context/pin-context";
import { usePlan } from "@/lib/swr/use-billing";
import useDatarooms from "@/lib/swr/use-datarooms";
import useLimits from "@/lib/swr/use-limits";
import { cn } from "@/lib/utils";
import { daysLeft } from "@/lib/utils";

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

export default function DataroomsPage() {
  const { datarooms } = useDatarooms();
  const { isFree, isPro, isBusiness, isDatarooms, isDataroomsPlus, isTrial } =
    usePlan();
  const { limits } = useLimits();
  const router = useRouter();
  const { pinnedItems, addPinnedItem, removePinnedItem } = usePins();

  const numDatarooms = datarooms?.length ?? 0;
  const limitDatarooms = limits?.datarooms ?? 1;

  const canCreateUnlimitedDatarooms =
    isDatarooms ||
    isDataroomsPlus ||
    (isBusiness && numDatarooms < limitDatarooms);

  const handlePinClick = async (
    e: React.MouseEvent,
    dataroom: { id: string; name: string },
  ) => {
    e.preventDefault();
    const isPinned =
      pinnedItems && Array.isArray(pinnedItems)
        ? pinnedItems.some((item) => item.dataroomId === dataroom.id)
        : false;

    try {
      if (isPinned) {
        const pinToRemove = pinnedItems.find(
          (item) => item.dataroomId === dataroom.id,
        );
        if (pinToRemove?.id) {
          await removePinnedItem(pinToRemove.id);
          toast.success("Dataroom unpinned");
        }
      } else {
        await addPinnedItem({
          pinType: "DATAROOM",
          dataroomId: dataroom.id,
          name: dataroom.name,
        });
        toast.success("Dataroom pinned");
      }
    } catch (error) {
      console.error(error);
    }
  };

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

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-4">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => handlePinClick(e, dataroom)}
                        >
                          <Pin
                            className={cn(
                              "h-4 w-4",
                              pinnedItems.some(
                                (item) => item.dataroomId === dataroom.id,
                              )
                                ? "fill-current text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          <span className="sr-only">Pin dataroom</span>
                        </Button>
                      </div>
                      {/* <CardDescription>{dataroom.pId}</CardDescription> */}
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
        </div>
      </main>
    </AppLayout>
  );
}
