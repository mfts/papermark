import { Fragment, useEffect, useState } from "react";
import { Menu, Dialog, Transition } from "@headlessui/react";
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
import { ModeToggle } from "./theme-toggle";
import LoadingSpinner from "./ui/loading-spinner";
import Banner from "./banner";
import ProBanner from "./billing/pro-banner";
import Cookies from "js-cookie";
import { usePlan } from "@/lib/swr/use-billing";
import Image from "next/image";
import SelectTeam from "./teams/select-team";
import { TeamContextType, initialState, useTeam } from "@/context/team-context";

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

  if (status === "loading" && loading)
    return <LoadingSpinner className="mr-1 h-5 w-5" />;

  const userPlan = plan && plan.plan;

  return (
    <>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 xl:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-background/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X
                        className="h-6 w-6 text-foreground"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar for mobile component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-black px-6 ring-1 ring-foreground/10">
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

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
                  <Menu as="div" className="relative grow">
                    <Menu.Button className="flex items-center group rounded-md gap-x-3 p-2 w-full text-sm font-semibold leading-6 text-foreground hover:bg-gray-200 hover:dark:bg-secondary">
                      <Image
                        className="h-8 w-8 rounded-full bg-secondary"
                        src={session?.user?.image || ""}
                        width={32}
                        height={32}
                        alt={`Profile picture of ${session?.user?.name}`}
                      />
                      <span className="flex items-center w-full justify-between">
                        <span className="sr-only">Your profile</span>
                        <span aria-hidden="true">{session?.user?.name}</span>
                        <ChevronUp
                          className="ml-2 h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 z-10 bottom-0 mb-14 w-full origin-bottom-left rounded-md bg-gray-100 dark:bg-primary-foreground py-2 focus:outline-none">
                        {session ? (
                          <>
                            <Menu.Item>
                              <div className="w-full">
                                <p className="block px-3 py-1 text-sm leading-6 text-muted-foreground">
                                  {session?.user?.email}
                                </p>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <p className="block px-3 py-1 text-sm leading-6 text-muted-foreground">
                                Help?{" "}
                                <a
                                  href="mailto:support@papermark.io"
                                  className="underline hover:text-muted-foreground/80"
                                >
                                  support@papermark.io
                                </a>
                              </p>
                            </Menu.Item>
                            <Menu.Item>
                              <Link
                                onClick={() =>
                                  signOut({
                                    callbackUrl: `${window.location.origin}`,
                                  })
                                }
                                className="block px-3 py-1 text-sm leading-6 text-foreground hover:bg-gray-200 hover:dark:bg-muted"
                                href={""}
                              >
                                Sign Out
                              </Link>
                            </Menu.Item>
                          </>
                        ) : null}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  <ModeToggle />
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Navbar */}
        <div className="sticky top-0 z-40 mb-1 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-50/90 bg-gray-50 dark:border-black/10 dark:bg-black/95 px-4 sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch items-center lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <Image
                    className="h-8 w-8 rounded-full bg-secondary"
                    src={session?.user?.image || ""}
                    width={32}
                    height={32}
                    alt={`Profile picture of ${session?.user?.name}`}
                  />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-fit origin-top-right rounded-md bg-primary-foreground shadow-lg py-2 ring-1 ring-primary-foreground/5 focus:outline-none">
                    {session ? (
                      <>
                        <Menu.Item>
                          <p className="block px-3 py-1 text-sm leading-6 text-muted-foreground">
                            {session?.user?.email}
                          </p>
                        </Menu.Item>
                        <Menu.Item>
                          <Link
                            onClick={() =>
                              signOut({
                                callbackUrl: `${window.location.origin}`,
                              })
                            }
                            className="block px-3 py-1 text-sm leading-6 text-foreground hover:bg-gray-200 hover:dark:bg-muted"
                            href={""}
                          >
                            Sign Out
                          </Link>
                        </Menu.Item>
                      </>
                    ) : null}
                  </Menu.Items>
                </Transition>
              </Menu>
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
