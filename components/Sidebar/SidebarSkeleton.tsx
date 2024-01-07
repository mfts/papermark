import React from 'react'
import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarSkeleton() {
    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gray-50 dark:bg-black px-6">
            <div className="flex h-16 shrink-0 items-center">
              <Skeleton className="w-40 h-9" />
            </div>
            <div className="flex flex-1 flex-col space-y-7">
              <div className="space-y-2">
                <Skeleton className="w-24 h-6" />
                <Skeleton className="w-52 h-9" />
              </div>
              <div className="mt-4 flex flex-1 flex-col gap-y-7 mx-2">
                <div>
                  <div className="-mx-2 space-y-3">
                    <Skeleton className="w-4/5 h-9" />
                    <Skeleton className="w-4/5 h-9" />
                    <Skeleton className="w-4/5 h-9" />
                    <Skeleton className="w-4/5 h-9" />
                  </div>
                </div>
                <div className="-mx-2 mt-auto mb-4">
                  <div className="flex justify-between items-center space-x-2">
                    <Skeleton className="w-full h-9" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
}

