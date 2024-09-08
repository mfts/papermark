import Link from "next/link";

import { useRef, useState } from "react";

import { ViewerGroup } from "@prisma/client";
import { motion } from "framer-motion";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  FlagIcon,
  GlobeIcon,
  Layers2Icon,
  MousePointerClickIcon,
  PenIcon,
  RefreshCcwDotIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import BarChart from "@/components/shared/icons/bar-chart";
import MoreVertical from "@/components/shared/icons/more-vertical";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn, nFormatter } from "@/lib/utils";

export default function GroupCard({ group }: { group: ViewerGroup }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="hover:drop-shadow-card-hover group rounded-xl border border-gray-200 bg-white p-4 transition-[filter] sm:p-5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden rounded-full border border-gray-200 sm:block">
              <div
                className={cn(
                  "rounded-full border border-white bg-gradient-to-t from-gray-100 p-1 md:p-3",
                )}
              >
                <UsersIcon className="size-5" />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <p className="truncate text-sm font-medium" title="Group Name">
                  {group.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-3">
            <Link
              onClick={(e) => {
                e.stopPropagation();
              }}
              href="#2"
              className="z-20 flex items-center space-x-1 rounded-md bg-gray-200 px-1.5 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100 dark:bg-gray-700 sm:px-2"
            >
              <BarChart className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
              <p className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                {nFormatter(10000)}
                <span className="ml-1 hidden sm:inline-block">views</span>
              </p>
            </Link>

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  // size="icon"
                  variant="outline"
                  className="z-20 h-8 w-8 border-gray-200 bg-transparent p-0 hover:bg-gray-200 dark:border-gray-700 hover:dark:bg-gray-700 lg:h-9 lg:w-9"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <PenIcon className="mr-2 h-4 w-4" />
                  Edit group
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Layers2Icon className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
