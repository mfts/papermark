import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import {
  ArrowDownAZ,
  ArrowDownWideNarrowIcon,
  CalendarArrowDownIcon,
  CheckIcon,
  ClockArrowDownIcon,
  Eye,
  Link,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

export default function SortButton() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<string | null>(null);

  useEffect(() => {
    const { sort } = router.query;
    if (
      sort &&
      ["name", "createdAt", "views", "lastViewed", "links"].includes(
        sort as string,
      )
    ) {
      setSortBy(sort as string);
    } else {
      setSortBy(null);
    }
  }, [router.query]);

  useEffect(() => {
    const currentQuery = { ...router.query };

    if (sortBy === null) {
      delete currentQuery.sort;
      delete currentQuery.page;
      delete currentQuery.limit;
    } else {
      currentQuery.sort = sortBy;
    }

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  }, [sortBy]);

  const resetSort = () => setSortBy(null);

  const getSortLabel = () => {
    switch (sortBy) {
      case "createdAt":
        return "Date Added";
      case "lastViewed":
        return "Recently Viewed";
      case "views":
        return "Number of Views";
      case "name":
        return "Name";
      case "links":
        return "Number of Links";
      default:
        return "";
    }
  };

  return (
    <div className="relative inline-block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={sortBy === null ? "icon" : "default"}
            variant={"outline"}
            title="Sort documents"
            className={cn(
              "space-x-2",
              sortBy !== null && "border-2 border-foreground",
            )}
          >
            <ArrowDownWideNarrowIcon className="h-4 w-4" />
            {sortBy !== null && (
              <span className="font-medium">{getSortLabel()}</span>
            )}
            <span className="sr-only">Sort documents</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setSortBy("name")}
            disabled={sortBy === "name"}
          >
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            Name
            {sortBy === "name" && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSortBy("createdAt")}
            disabled={sortBy === "createdAt"}
          >
            <CalendarArrowDownIcon className="mr-2 h-4 w-4" />
            Date Added
            {sortBy === "createdAt" && (
              <CheckIcon className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSortBy("lastViewed")}
            disabled={sortBy === "lastViewed"}
          >
            <ClockArrowDownIcon className="mr-2 h-4 w-4" />
            Recently Viewed
            {sortBy === "lastViewed" && (
              <CheckIcon className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSortBy("views")}
            disabled={sortBy === "views"}
          >
            <Eye className="mr-2 h-4 w-4" />
            Number of Views
            {sortBy === "views" && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSortBy("links")}
            disabled={sortBy === "links"}
          >
            <Link className="mr-2 h-4 w-4" />
            Number of Links
            {sortBy === "links" && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          {sortBy !== null && (
            <DropdownMenuItem
              onClick={resetSort}
              className="text-destructive focus:bg-destructive/80"
            >
              <XCircleIcon className="mr-2 h-4 w-4" />
              Reset Sort
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
