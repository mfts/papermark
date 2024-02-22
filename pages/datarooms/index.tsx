import DataroomCard from "@/components/datarooms/dataroom-card";
import Skeleton from "@/components/Skeleton";
import { PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import SelectDataroomTypeModal from "@/components/datarooms/select-dataroom-type-modal";
import { DataroomWithFilesAndFolders } from "@/lib/types";
import { useTeam } from "@/context/team-context";
import useDatarooms from "@/lib/swr/use-datarooms";

export interface DataroomWithFilesFoldersAndFilesCount
  extends DataroomWithFilesAndFolders {
  _count: {
    files: number;
  };
}

export default function Datarooms() {
  const { datarooms } = useDatarooms();

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl text-foreground font-semibold tracking-tight">
              Datarooms
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your datarooms
            </p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <SelectDataroomTypeModal>
              <Button>Add New Dataroom</Button>
            </SelectDataroomTypeModal>
          </ul>
        </div>

        <Separator className="my-6 bg-gray-200 dark:bg-gray-800" />

        {datarooms && datarooms.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <EmptyDataRooms />
          </div>
        )}

        {/* Datarooms list */}
        <ul role="list" className="space-y-4">
          {!datarooms &&
            Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
              >
                <Skeleton key={i} className="h-5 w-20" />
                <Skeleton key={i} className="mt-3 h-3 w-10" />
              </li>
            ))}

          {datarooms &&
            datarooms.map((dataroom) => {
              return (
                <DataroomCard
                  key={dataroom.id}
                  dataroom={dataroom}
                />
              );
            })}
        </ul>
      </div>
    </AppLayout>
  );
}

export function EmptyDataRooms() {
  return (
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No data rooms
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new data room.
      </p>
      <div className="mt-6">
        <SelectDataroomTypeModal>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-foreground bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Data Room
          </button>
        </SelectDataroomTypeModal>
      </div>
    </div>
  );
}
