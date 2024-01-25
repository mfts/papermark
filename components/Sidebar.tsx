import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import FolderIcon from "@/components/shared/icons/folder";
import PieChartIcon from "@/components/shared/icons/pie-chart";
import SettingsIcon from "@/components/shared/icons/settings";
import MenuIcon from "@/components/shared/icons/menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import Banner from "./banner";
import ProBanner from "./billing/pro-banner";
import Cookies from "js-cookie";
import { usePlan } from "@/lib/swr/use-billing";
import SelectTeam from "./teams/select-team";
import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileMenu from "./profile-menu";

export default function Sidebar() {
  return (
    <>
      {/* Static sidebar for desktop */}
      <SidebarComponent className="hidden lg:flex" />

      {/* sidebar for mobile */}
      <nav>
        <div className="sticky top-0 z-40 mb-1 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-50/90 bg-gray-50 dark:border-black/10 dark:bg-black/95 px-4 sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="-m-2.5 p-2.5 text-muted-foreground lg:hidden">
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[300px] lg:hidden p-0 m-0">
              <SidebarComponent className="flex" />
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 gap-x-4 self-stretch items-center lg:gap-x-6 justify-end">
            <ProfileMenu size="small" className="mr-3 mt-1.5" />
          </div>
        </div>
      </nav>
    </>
  );
}

export const SidebarComponent = ({ className }: { className?: string }) => {
  const [showProBanner, setShowProBanner] = useState<boolean | null>(null);
  const { data: session, status } = useSession();
  const { plan, loading } = usePlan();

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

  const userPlan = plan && plan.plan;

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

  return (
    <aside
      className={cn("w-full lg:w-[380px] flex flex-col relative", className)}
    >
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-gray-50 dark:bg-black px-4 lg:px-6 pt-4 lg:pt-6">
        <div className="flex h-16 shrink-0 items-center space-x-3">
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

          <section className="flex flex-1 flex-col gap-y-7 !mt-5">
            <div className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  disabled={item.disabled}
                  className={cn(
                    item.current
                      ? "bg-gray-200 dark:bg-secondary text-secondary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-200 hover:dark:bg-muted duration-200",
                    "group flex gap-x-3 items-center rounded-md px-3 py-2 text-sm leading-6 w-full disabled:hover:bg-transparent disabled:text-muted-foreground disabled:cursor-default",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </button>
              ))}
            </div>

            <div className="-mx-2 mt-auto mb-4">
              {/* if user is on trial show banner,
               * if user is pro show nothing,
               * if user is free and showProBanner is true show pro banner
               */}
              {userPlan === "trial" && session ? (
                <Banner session={session} />
              ) : null}
              {userPlan === "pro" && null}
              {userPlan === "free" && showProBanner ? (
                <ProBanner setShowProBanner={setShowProBanner} />
              ) : null}

              <div className="w-full hidden lg:block">
                <ProfileMenu
                  size="large"
                  className="lg:w-[240px] xl:w-[270px]"
                />
              </div>
            </div>
          </section>
        </nav>
      </div>
    </aside>
  );
};
