"use client";

import Link from "next/link";
import { useRouter } from "next/router";

import * as React from "react";
import { useEffect, useState } from "react";

import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import Cookies from "js-cookie";
import {
  BrushIcon,
  ChartNoAxesColumn,
  ChartNoAxesColumnIcon,
  CogIcon,
  ContactIcon,
  FolderIcon,
  HouseIcon,
  Loader,
  ServerIcon,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { nFormatter } from "@/lib/utils";

import ProBanner from "../billing/pro-banner";
import { Progress } from "../ui/progress";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [showProBanner, setShowProBanner] = useState<boolean | null>(null);
  const { currentTeam, teams, setCurrentTeam, isLoading }: TeamContextType =
    useTeam() || initialState;
  const { plan: userPlan, trial: userTrial } = usePlan();
  const { limits } = useLimits();
  const linksLimit = limits?.links;
  const documentsLimit = limits?.documents;

  useEffect(() => {
    if (Cookies.get("hideProBanner") !== "pro-banner") {
      setShowProBanner(true);
    } else {
      setShowProBanner(false);
    }
  }, []);

  const data = {
    navMain: [
      // {
      //   title: "Dashboard",
      //   url: "/dashboard",
      //   icon: HouseIcon,
      //   current: router.pathname.includes("dashboard"),
      // },
      {
        title: "All Documents",
        url: "/documents",
        icon: FolderIcon,
        current:
          router.pathname.includes("documents") &&
          !router.pathname.includes("tree") &&
          !router.pathname.includes("datarooms"),
      },
      {
        title: "All Datarooms",
        url: "/datarooms",
        icon: ServerIcon,
        current: router.pathname.includes("datarooms"),
      },
      {
        title: "Visitors",
        url: "/visitors",
        icon: ContactIcon,
        current: router.pathname.includes("visitors"),
      },
      {
        title: "Branding",
        url: "/branding",
        icon: BrushIcon,
        current:
          router.pathname.includes("branding") &&
          !router.pathname.includes("datarooms"),
      },
      {
        title: "Settings",
        url: "/settings/general",
        icon: CogIcon,
        isActive:
          router.pathname.includes("settings") &&
          !router.pathname.includes("branding") &&
          !router.pathname.includes("datarooms") &&
          !router.pathname.includes("documents"),
        items: [
          {
            title: "General",
            url: "/settings/general",
            current: router.pathname.includes("settings/general"),
          },
          {
            title: "People",
            url: "/settings/people",
            current: router.pathname.includes("settings/people"),
          },
          {
            title: "Domains",
            url: "/settings/domains",
            current: router.pathname.includes("settings/domains"),
          },
          {
            title: "Billing",
            url: "/settings/billing",
            current: router.pathname.includes("settings/billing"),
          },
        ],
      },
    ],
  };

  return (
    <Sidebar
      className="bg-gray-50 dark:bg-black"
      sidebarClassName="bg-gray-50 dark:bg-black"
      side="left"
      variant="inset"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="gap-y-8">
        <p className="hidden w-full justify-center text-2xl font-bold tracking-tighter text-black group-data-[collapsible=icon]:inline-flex dark:text-white">
          <Link href="/documents">P</Link>
        </p>
        <p className="ml-2 flex items-center text-2xl font-bold tracking-tighter text-black group-data-[collapsible=icon]:hidden dark:text-white">
          <Link href="/documents">Papermark</Link>
          {userPlan && userPlan != "free" ? (
            <span className="ml-4 rounded-full bg-background px-2.5 py-1 text-xs tracking-normal text-foreground ring-1 ring-gray-800">
              {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
            </span>
          ) : null}
          {userTrial ? (
            <span className="ml-2 rounded-sm bg-foreground px-2 py-0.5 text-xs tracking-normal text-background ring-1 ring-gray-800">
              Trial
            </span>
          ) : null}
        </p>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm">
            <Loader className="h-5 w-5 animate-spin" /> Loading teams...
          </div>
        ) : (
          <TeamSwitcher
            currentTeam={currentTeam}
            teams={teams}
            setCurrentTeam={setCurrentTeam}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <div>
              {/*
               * if user is free and showProBanner is true show pro banner
               */}
              {userPlan === "free" && showProBanner ? (
                <ProBanner setShowProBanner={setShowProBanner} />
              ) : null}

              <div className="mb-2">
                {linksLimit ? (
                  <UsageProgress
                    title="Links"
                    unit="links"
                    usage={limits?.usage?.links}
                    usageLimit={linksLimit}
                  />
                ) : null}
                {documentsLimit ? (
                  <UsageProgress
                    title="Documents"
                    unit="documents"
                    usage={limits?.usage?.documents}
                    usageLimit={documentsLimit}
                  />
                ) : null}
                {linksLimit || documentsLimit ? (
                  <p className="mt-2 px-2 text-xs text-muted-foreground">
                    Change plan to increase usage limits
                  </p>
                ) : null}
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function UsageProgress(data: {
  title: string;
  unit: string;
  usage?: number;
  usageLimit?: number;
}) {
  let { title, unit, usage, usageLimit } = data;
  let usagePercentage = 0;
  if (usage !== undefined && usageLimit !== undefined) {
    usagePercentage = (usage / usageLimit) * 100;
  }

  return (
    <div className="p-2">
      <div className="mt-1 flex flex-col space-y-1">
        {usage !== undefined && usageLimit !== undefined ? (
          <p className="text-xs text-foreground">
            <span>{nFormatter(usage)}</span> / {nFormatter(usageLimit)} {unit}
          </p>
        ) : (
          <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
        )}
        <Progress value={usagePercentage} className="h-1 bg-muted" max={100} />
      </div>
    </div>
  );
}
