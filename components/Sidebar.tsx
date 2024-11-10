"use client";

import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import Cookies from "js-cookie";
import {
  CogIcon,
  ContactIcon,
  FolderIcon as FolderLucideIcon,
  FolderOpenIcon,
  PaletteIcon,
  ServerIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { cn, nFormatter } from "@/lib/utils";

import ProBanner from "./billing/pro-banner";
import { UpgradePlanModal } from "./billing/upgrade-plan-modal";
import ProfileMenu from "./profile-menu";
import SiderbarFolders from "./sidebar-folders";
import SelectTeam from "./teams/select-team";
import { Progress } from "./ui/progress";

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
      {/* <div className="flex items-center space-x-2">
        <h3 className="font-medium">{title}</h3>
      </div> */}

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

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [showProBanner, setShowProBanner] = useState<boolean | null>(null);
  const { plan: userPlan, trial: userTrial } = usePlan();
  const isTrial = !!userTrial;
  const { limits } = useLimits();
  const linksLimit = limits?.links;
  const documentsLimit = limits?.documents;
  const isMobile=useIsMobile();

  const router = useRouter();
  const { currentTeam, teams, isLoading }: TeamContextType =
    useTeam() || initialState;

  useEffect(() => {
    if (Cookies.get("hideProBanner") !== "pro-banner") {
      setShowProBanner(true);
    } else {
      setShowProBanner(false);
    }
  }, []);

  const navigation = [
    // {
    //   name: "Overview",
    //   href: "/overview",
    //   icon: HomeIcon,
    //   current: router.pathname.includes("overview"),
    //   disabled: true,
    // },
    {
      name: "Documents",
      href: "/documents",
      icon:
        router.pathname.includes("documents") &&
        !router.pathname.includes("datarooms")
          ? FolderOpenIcon
          : FolderLucideIcon,
      current:
        router.pathname.includes("documents") &&
        !router.pathname.includes("tree") &&
        !router.pathname.includes("datarooms"),
      active:
        router.pathname.includes("documents") &&
        !router.pathname.includes("datarooms"),
      disabled: false,
    },
    {
      name: "Datarooms",
      href: "/datarooms",
      icon: ServerIcon,
      current: router.pathname.includes("datarooms"),
      active: false,
      disabled:
        userPlan === "business" || userPlan === "datarooms" || isTrial
          ? false
          : true,
    },
    {
      name: "Visitors",
      href: "/visitors",
      icon: ContactIcon,
      current: router.pathname.includes("visitors"),
      active: false,
      disabled: userPlan === "free" && !isTrial ? true : false,
    },
    {
      name: "Branding",
      href: "/settings/branding",
      icon: PaletteIcon,
      current: router.pathname.includes("branding"),
      active: false,
      disabled: false,
    },
    {
      name: "Settings",
      href: "/settings/general",
      icon: CogIcon,
      current:
        router.pathname.includes("settings") &&
        !router.pathname.includes("branding") &&
        !router.pathname.includes("datarooms") &&
        !router.pathname.includes("documents"),
      active: false,
      disabled: false,
    },
  ];
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>



            <SidebarMenuButton size="lg" asChild className="hover:bg-inherit pt-0">
              <Link href="/documents">
                {!open && (
                  <span className="round flex aspect-square size-8 items-center justify-center text-2xl font-bold tracking-tighter text-black dark:text-white">
                    {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"> */}
                    P {/*should be replaced by actual logo*/}
                    {/* </div> */}
                  </span>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex h-16 shrink-0 items-center space-x-3">
                  {open && 
                    <span className="flex items-center text-2xl font-bold tracking-tighter text-black dark:text-white">
                      Papermark
                    </span>
}
                    {/* {userPlan && userPlan != "free" ? (
                      <span className="ml-4 rounded-full bg-background px-2.5 py-1 text-xs tracking-normal text-foreground ring-1 ring-gray-800">
                        {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                      </span>
                    ) : null}
                    {!isTrial ? (
                      <span className="ml-4 rounded-sm bg-foreground px-2 py-0.5 text-xs tracking-normal text-background ring-1 ring-gray-800">
                        Trial
                      </span>
                    ) : null} */}
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div>
          <SelectTeam
            currentTeam={currentTeam}
            teams={teams}
            isLoading={isLoading}
            setCurrentTeam={() => {}}
          />
        </div>
      </SidebarHeader>
                      
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="overflow-x-hidden">
            {navigation.map((item) => {
              if (item.name === "Documents") {
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
                      isActive={item.current}
                      className="mt-1 h-fit w-full cursor-pointer gap-3 py-2.5 pe-3 ps-3 text-sm group-data-[collapsible=icon]:ps-4 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
                      onClick={() => router.push(item.href)}
                    >
                      <span className="sidebar-icon">
                        <item.icon />
                        {item.name}
                      </span>
                    </SidebarMenuButton>
                    {open && item.active ? <SiderbarFolders /> : null}
                  </SidebarMenuItem>
                );
              }
              if (
                userPlan !== "business" &&
                userPlan !== "datarooms" &&
                !isTrial &&
                item.name === "Datarooms"
              ) {
                return (
                  <UpgradePlanModal
                    key={item.name}
                    clickedPlan={"Business"}
                    trigger={"sidebar_datarooms"}
                  >
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        className="hover:text-muted-foregroundh-fit w-full gap-3 p-2 ps-3 text-base text-sm leading-6 text-muted-foreground hover:bg-inherit group-data-[collapsible=icon]:ps-4 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
                        asChild
                        tooltip={item.name}
                        isActive={item.current}
                      >
                        <span className="sidebar-icon">
                          {/* <div className="group flex w-full items-center gap-x-2 rounded-md py-2 ml-2 text-sm leading-6 text-muted-foreground hover:bg-transparent"> */}
                          <item.icon
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                          {item.name}
                        </span>
                        {/* </div> */}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </UpgradePlanModal>
                );
              }
              if (userPlan == "free" && !isTrial && item.name === "Visitors") {
                return (
                  <UpgradePlanModal
                    key={item.name}
                    clickedPlan={"Pro"}
                    trigger={"sidebar_visitors"}
                  >
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
                      isActive={item.current}
                      className="hover:text-muted-foregroundh-fit w-full gap-3 p-2 ps-3 text-base text-sm leading-6 text-muted-foreground hover:bg-inherit group-data-[collapsible=icon]:ps-4 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
                    >
                      <span className="sidebar-icon">
                        <item.icon
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </span>
                    </SidebarMenuButton>
                  </UpgradePlanModal>
                );
              }

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.name}
                    isActive={item.current}
                    onClick={() => router.push(item.href)}
                    className="mt-1 h-fit w-full cursor-pointer gap-3 p-2 py-2.5 ps-3 text-sm group-data-[collapsible=icon]:ps-4 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
                  >
                    <span className="sidebar-icon">
                      <item.icon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mb-1">
          {/*
           * if user is free and showProBanner is true show pro banner
           */}
          {open && (
            <>
              {userPlan === "free" && showProBanner && (
                <ProBanner setShowProBanner={setShowProBanner} />
              )}

              <div className="mb-2">
                {linksLimit && (
                  <UsageProgress
                    title="Links"
                    unit="links"
                    usage={limits?.usage?.links}
                    usageLimit={linksLimit}
                  />
                )}
                {documentsLimit && (
                  <UsageProgress
                    title="Documents"
                    unit="documents"
                    usage={limits?.usage?.documents}
                    usageLimit={documentsLimit}
                  />
                )}
                {(linksLimit || documentsLimit) && (
                  <p className="mt-2 px-2 text-xs text-muted-foreground">
                    Change plan to increase usage limits
                  </p>
                )}
              </div>
            </>
          )}
          {/* <div className="hidden w-full lg:block"> */}
          {!isMobile  &&
          <ProfileMenu size="large" />
          }
          {/* </div> */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
