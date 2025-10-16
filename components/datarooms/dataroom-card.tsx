"use client";

import Link from "next/link";
import { useRouter } from "next/router";

import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DataroomLink = {
  id: string;
  isArchived: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

type DataroomView = {
  viewedAt: Date;
};

type DataroomWithDetails = {
  id: string;
  name: string;
  _count: {
    documents: number;
    views: number;
  };
  links: DataroomLink[];
  views: DataroomView[];
  createdAt: Date;
};

interface DataroomCardProps {
  dataroom: DataroomWithDetails;
}

export default function DataroomCard({ dataroom }: DataroomCardProps) {
  const router = useRouter();

  // Calculate active links
  const activeLinks = dataroom.links.filter((link) => {
    if (link.isArchived) return false;
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) return false;
    return true;
  });

  const isActive = activeLinks.length > 0;
  const activeLinkCount = activeLinks.length;
  const lastViewedAt = dataroom.views[0]?.viewedAt;
  const hasDocuments = dataroom._count.documents > 0;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasDocuments) {
      // If no documents, go to documents tab
      router.push(`/datarooms/${dataroom.id}/documents`);
    } else if (!isActive) {
      // If has documents but inactive, go to permissions/share
      router.push(`/datarooms/${dataroom.id}/permissions`);
    }
  };

  return (
    <Card className="group relative overflow-hidden duration-500 hover:border-primary/50">
      <Link href={`/datarooms/${dataroom.id}/documents`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="truncate text-lg">{dataroom.name}</CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.preventDefault()}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isActive ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isActive
                        ? "Dataroom has active links"
                        : "No active links"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats List */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Documents</div>
              <div className="text-sm text-muted-foreground">
                {dataroom._count.documents}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Views</div>
              <div className="text-sm text-muted-foreground">
                {dataroom._count.views}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Active Links</div>
              <div className="text-sm text-muted-foreground">
                {activeLinkCount}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-xs text-muted-foreground">
              {lastViewedAt ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span>
                        Viewed{" "}
                        {formatDistanceToNow(new Date(lastViewedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last viewed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span>No views yet</span>
              )}
            </div>

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {!hasDocuments ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                        onClick={handleButtonClick}
                      >
                        <span>Add Documents</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add documents to dataroom</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                !isActive && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                          onClick={handleButtonClick}
                        >
                          <span>Share</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share dataroom</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
