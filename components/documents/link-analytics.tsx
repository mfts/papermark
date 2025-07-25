import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";

import { useState } from "react";

import { DocumentVersion, View } from "@prisma/client";
import { Label } from "@radix-ui/react-label";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import StatsElement from "@/components/documents/stats-element";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";

import { Switch } from "../ui/switch";

interface LinkAnalyticsProps {
  teamId: string;
  documentId: string;
  primaryVersion: DocumentVersion;
}

export default function LinkAnalytics({
  teamId,
  documentId,
  primaryVersion,
}: LinkAnalyticsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialExclude = searchParams?.get("excludeInternal") === "true";
  const [excludeTeamMembers, setExcludeTeamMembers] =
    useState<boolean>(initialExclude);

  const { data, error, isLoading } = useSWR<{
    views: View[];
    totalViews: number;
  }>(
    `/api/teams/${teamId}/documents/${documentId}/link-analytics${excludeTeamMembers ? "?excludeTeamMembers=true" : ""}`,
    fetcher,
  );

  if (error) {
    console.error("Error loading link analytics:", error);
    return null;
  }

  const onToggle = (checked: boolean) => {
    setExcludeTeamMembers(checked);
    const params = new URLSearchParams(searchParams?.toString());
    params.set("excludeInternal", checked.toString());
    router.push(`${documentId}/?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-[300px] items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!data?.views?.length) {
    const emptyStats = [
      {
        name: "Total Views",
        value: "0",
        active: false,
      },
      {
        name: "Total Clicks",
        value: "0",
        active: false,
      },
      {
        name: "Last Visited",
        value: "Never",
        active: false,
      },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end space-x-2">
          <Switch
            disabled={isLoading}
            id="toggle-stats"
            checked={excludeTeamMembers}
            onCheckedChange={onToggle}
          />
          <Label
            htmlFor="toggle-stats"
            className={excludeTeamMembers ? "" : "text-muted-foreground"}
          >
            Exclude internal visits
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emptyStats.map((stat, index) => (
            <StatsElement key={stat.name} stat={stat} statIdx={index} />
          ))}
        </div>
      </div>
    );
  }

  const totalViews = data?.views?.length ?? 0;
  const totalClicks = data?.views?.filter((v) => !!v.redirectAt).length ?? 0;
  const lastRedirected = data?.views?.length
    ? data.views
        .map((v) => v.redirectAt)
        .filter((d) => typeof d === "string" && !!d)
        .sort(
          (a, b) =>
            new Date(b as string).getTime() - new Date(a as string).getTime(),
        )[0]
    : null;

  const stats = [
    {
      name: "Total Views",
      value: totalViews.toString(),
      active: true,
    },
    {
      name: "Total Clicks",
      value: totalClicks.toString(),
      active: true,
    },
    {
      name: "Last Redirection",
      value: lastRedirected
        ? formatDistanceToNow(new Date(lastRedirected), { addSuffix: true })
        : "Never Visited",
      active: true,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end space-x-2">
        <Switch
          disabled={isLoading}
          id="toggle-stats"
          checked={excludeTeamMembers}
          onCheckedChange={onToggle}
        />
        <Label
          htmlFor="toggle-stats"
          className={excludeTeamMembers ? "" : "text-muted-foreground"}
        >
          Exclude internal visits
        </Label>
      </div>
      <div className="space-y-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <StatsElement key={stat.name} stat={stat} statIdx={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
