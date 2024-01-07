import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import HomeIcon from "@/components/shared/icons/home";
import FolderIcon from "@/components/shared/icons/folder";
import PieChartIcon from "@/components/shared/icons/pie-chart";
import SettingsIcon from "@/components/shared/icons/settings";
import MenuIcon from "@/components/shared/icons/menu";
import ChevronUp from "@/components/shared/icons/chevron-up";
import X from "@/components/shared/icons/x";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import { ModeToggle } from "../theme-toggle";
import LoadingSpinner from "../ui/loading-spinner";
import Banner from "../banner";
import ProBanner from "../billing/pro-banner";
import Cookies from "js-cookie";
import { usePlan } from "@/lib/swr/use-billing";
import Image from "next/image";
import SelectTeam from "../teams/select-team";
import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import UserRound from "../shared/icons/user-round";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "./MobileHeader";
import SidebarSkeleton from "./SidebarSkeleton";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const { plan, loading } = usePlan();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showProBanner, setShowProBanner] = useState<boolean | null>(null);
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

  useEffect(() => {
    if (Cookies.get("hideProBanner") !== "pro-banner") {
      setShowProBanner(true);
    } else {
      setShowProBanner(false);
    }
  }, []);

  if (status === "loading" && loading) return <SidebarSkeleton />;

  const userPlan = plan && plan.plan;

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-black px-6">
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
              <li className="-mx-2 mt-auto mb-4">
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
                <div className="flex justify-between items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center group rounded-md gap-x-2 p-2 grow text-sm font-semibold leading-6 text-foreground hover:bg-gray-200 hover:dark:bg-secondary ">
                      {session?.user?.image ? (
                        <Image
                          className="h-8 w-8 rounded-full bg-secondary"
                          src={session?.user?.image}
                          width={32}
                          height={32}
                          alt={`Profile picture of ${session?.user?.name}`}
                        />
                      ) : (
                        <div className="">
                          <UserRound className="h-8 w-8 p-1 rounded-full ring-1 ring-muted-foreground/50 bg-secondary" />
                        </div>
                      )}
                      <span className="flex items-center w-full justify-between">
                        <span className="sr-only">Your profile</span>
                        <span aria-hidden="true">
                          {session?.user?.name
                            ? session?.user?.name
                            : session?.user?.email?.split("@")[0]}
                        </span>
                        <ChevronUp
                          className="ml-2 h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52">
                      {session ? (
                        <>
                          <DropdownMenuItem disabled >
                            <div className="w-full">
                                {session?.user?.email}
                            </div>
                          </DropdownMenuItem >
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled >
                              Help?
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-muted-foreground" >
                              <a
                                href="mailto:support@papermark.io"
                                className="underline hover:text-muted-foreground/80"
                              >
                                support@papermark.io
                              </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Link
                              onClick={() =>
                                signOut({
                                  callbackUrl: `${window.location.origin}`,
                                })
                              }
                              // className="block px-3 py-1 text-sm leading-6 text-foreground hover:bg-gray-200 hover:dark:bg-muted"
                              href={""}
                            >
                              Sign Out
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ModeToggle />
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Navbar */}
        <MobileHeader session={session} />
      </div>
    </>
  );
}
