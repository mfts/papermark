import React from "react";
import SelectTeam from "../teams/select-team";
import { usePlan } from "@/lib/swr/use-billing";
import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import HomeIcon from "@/components/shared/icons/home";
import FolderIcon from "@/components/shared/icons/folder";
import PieChartIcon from "@/components/shared/icons/pie-chart";
import SettingsIcon from "@/components/shared/icons/settings";

export default function SidebarContent() {
  const { plan, loading } = usePlan();
  const router = useRouter();

  const { currentTeam, teams, isLoading }: TeamContextType =
    useTeam() || initialState;

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
      icon: FolderIcon,
      current: router.pathname.includes("documents"),
      disabled: false,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: PieChartIcon,
      current: router.pathname.includes("analytics"),
      disabled: true,
    },
    {
      name: "Settings",
      href: "/settings/general",
      icon: SettingsIcon,
      current: router.pathname.includes("settings"),
      disabled: false,
    },
  ];

  const userPlan = plan && plan.plan;

  return (
    <>
        <div className="flex h-16 shrink-0 items-center">
          <p className="text-2xl font-bold tracking-tighter text-black dark:text-white flex items-center">
            Papermark{" "}
            {userPlan == "pro" ? (
              <span className="bg-background text-foreground ring-1 ring-gray-800 rounded-full px-2.5 py-1 text-xs ml-4">
                Pro
              </span>
            ) : null}
          </p>
        </div>
        <nav className="flex flex-1 flex-col">
          <SelectTeam
            currentTeam={currentTeam}
            teams={teams}
            isLoading={isLoading}
            setCurrentTeam={() => {}}
          />
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => router.push(item.href)}
                      className={cn(
                        item.current
                          ? "bg-gray-200 dark:bg-secondary text-secondary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-200 hover:dark:bg-muted",
                        "group flex gap-x-3 items-center rounded-md p-2 text-sm leading-6 w-full disabled:hover:bg-transparent disabled:text-muted-foreground disabled:cursor-default",
                      )}
                      disabled={item.disabled}
                    >
                      <item.icon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
    </>
  );
}
