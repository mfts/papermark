"use client";

import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import * as React from "react";

import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import Cookies from "js-cookie";
import {
  CogIcon,
  FolderIcon as FolderLucideIcon,
  FolderOpenIcon,
  PaletteIcon,
  ServerIcon,
} from "lucide-react";
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LeafyGreen,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import { useSession } from "next-auth/react";

import MenuIcon from "@/components/shared/icons/menu";
import { NavMain } from "@/components/sidebar/nav-main";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

import Banner from "./banner";
import ProBanner from "./billing/pro-banner";
import { UpgradePlanModal } from "./billing/upgrade-plan-modal";
import ProfileMenu from "./profile-menu";
import SiderbarFolders from "./sidebar-folders";
import { AddTeamModal } from "./teams/add-team-modal";
import SelectTeam from "./teams/select-team";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";

// export default function Sidebar() {
//   return (
//     <>
//       <nav>
//         {/* sidebar for desktop */}
//         <SidebarComponent className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex" />

//         {/* move main screen to the right by width of the sidebar on desktop */}
//         <div className="lg:pl-72"></div>
//         {/* sidebar for mobile */}
//         <div className="sticky top-0 z-40 mb-1 flex h-14 shrink-0 items-center border-b border-gray-50/90 bg-gray-50 px-6 dark:border-none dark:border-black/10 dark:bg-black/95 sm:px-12 lg:hidden">
//           <Sheet>
//             <SheetTrigger asChild>
//               <button className="mt-1 p-0.5 text-muted-foreground lg:hidden">
//                 <MenuIcon className="h-6 w-6" aria-hidden="true" />
//               </button>
//             </SheetTrigger>
//             <SheetContent
//               side="left"
//               className="m-0 w-[280px] p-0 sm:w-[300px] lg:hidden"
//             >
//               <SidebarComponent className="flex" />
//             </SheetContent>
//           </Sheet>
//           <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
//             <ProfileMenu size="small" className="mr-3 mt-1.5" />
//           </div>
//         </div>
//       </nav>
//     </>
//   );
// }

// export const SidebarComponent = ({ className }: { className?: string }) => {
// const [showProBanner, setShowProBanner] = useState<boolean | null>(null);
// const { data: session, status } = useSession();
// const { plan: userPlan, trial: userTrial, loading } = usePlan();
// const isTrial = !!userTrial;
// const { limits } = useLimits();
// const linksLimit = limits?.links;
// const documentsLimit = limits?.documents;

// const router = useRouter();
// const { currentTeam, teams, isLoading }: TeamContextType =
//   useTeam() || initialState;

// useEffect(() => {
//   if (Cookies.get("hideProBanner") !== "pro-banner") {
//     setShowProBanner(true);
//   } else {
//     setShowProBanner(false);
//   }
// }, []);

// const navigation = [
//   // {
//   //   name: "Overview",
//   //   href: "/overview",
//   //   icon: HomeIcon,
//   //   current: router.pathname.includes("overview"),
//   //   disabled: true,
//   // },
//   {
//     name: "Documents",
//     href: "/documents",
//     icon:
//       router.pathname.includes("documents") &&
//       !router.pathname.includes("datarooms")
//         ? FolderOpenIcon
//         : FolderLucideIcon,
//     current:
//       router.pathname.includes("documents") &&
//       !router.pathname.includes("tree") &&
//       !router.pathname.includes("datarooms"),
//     active:
//       router.pathname.includes("documents") &&
//       !router.pathname.includes("datarooms"),
//     disabled: false,
//   },
//   {
//     name: "Datarooms",
//     href: "/datarooms",
//     icon: ServerIcon,
//     current: router.pathname.includes("datarooms"),
//     active: false,
//     disabled:
//       userPlan === "business" ||
//       userPlan === "datarooms" ||
//       userTrial === "drtrial"
//         ? false
//         : true,
//   },
//   {
//     name: "Branding",
//     href: "/settings/branding",
//     icon: PaletteIcon,
//     current: router.pathname.includes("branding"),
//     active: false,
//     disabled: false,
//   },
//   {
//     name: "Settings",
//     href: "/settings/general",
//     icon: CogIcon,
//     current:
//       router.pathname.includes("settings") &&
//       !router.pathname.includes("branding") &&
//       !router.pathname.includes("datarooms") &&
//       !router.pathname.includes("documents"),
//     active: false,
//     disabled: false,
//   },
// ];

//   return (
//     <div>
//       <aside
//         className={cn(
//           "h-dvh w-full flex-shrink-0 flex-col justify-between gap-y-6 bg-gray-50 px-4 pt-4 dark:bg-black lg:w-72 lg:px-6 lg:pt-6",
//           className,
//         )}
//       >
//         {/* Sidebar component, swap this element with another sidebar if you like */}

//         <div className="flex h-16 shrink-0 items-center space-x-3">
//           <p className="flex items-center text-2xl font-bold tracking-tighter text-black dark:text-white">
//             <Link href="/documents">Papermark{" "}</Link>
// {userPlan && userPlan != "free" ? (
//   <span className="ml-4 rounded-full bg-background px-2.5 py-1 text-xs tracking-normal text-foreground ring-1 ring-gray-800">
//     {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
//   </span>
// ) : null}
// {isTrial ? (
//   <span className="ml-4 rounded-sm bg-foreground px-2 py-0.5 text-xs tracking-normal text-background ring-1 ring-gray-800">
//     Trial
//   </span>
// ) : null}
//           </p>
//         </div>

// <SelectTeam
//   currentTeam={currentTeam}
//   teams={teams}
//   isLoading={isLoading}
//   setCurrentTeam={() => {}}
// />

//         {/* <div className="flex items-center gap-x-1">
//           <AddDocumentModal>
//             <Button
//               className="flex-1 text-left group flex gap-x-3 items-center justify-start px-3"
//               title="Add New Document"
//             >
//               <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
//               <span>Add New Document</span>
//             </Button>
//           </AddDocumentModal>
//           <AddFolderModal>
//             <Button
//               size="icon"
//               variant="outline"
//               className="bg-gray-50 dark:bg-black border-gray-500 hover:bg-gray-200 hover:dark:bg-muted"
//             >
//               <FolderPlusIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
//             </Button>
//           </AddFolderModal>
//         </div> */}

//         <ScrollArea className="flex-grow" showScrollbar>
//           <section className="flex flex-1 flex-col gap-y-6">
//             <div className="space-y-2">
//               {navigation.map((item) => {
//                 if (item.name === "Documents") {
//                   return (
//                     <div key={item.name}>
//                       <button
//                         onClick={() => router.push(item.href)}
//                         disabled={item.disabled}
//                         className={cn(
//                           item.current
//                             ? "bg-gray-200 font-semibold text-foreground dark:bg-secondary"
//                             : "duration-200 hover:bg-gray-200 hover:dark:bg-muted",
//                           "group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-sm leading-6 disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent",
//                         )}
//                       >
//                         <item.icon
//                           className="h-5 w-5 shrink-0"
//                           aria-hidden="true"
//                         />
//                         {item.name}
//                       </button>
//                       {item.active ? <SiderbarFolders /> : null}
//                     </div>
//                   );
//                 }
// if (
//   userPlan !== "business" &&
//   userPlan !== "datarooms" &&
//   userTrial !== "drtrial" &&
//   item.name === "Datarooms"
// ) {
//   return (
// <UpgradePlanModal
//   key={item.name}
//   clickedPlan={"Business"}
//   trigger={"datarooms"}
// >
// <div className="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-sm leading-6 text-muted-foreground hover:bg-transparent">
//   <item.icon
//     className="h-5 w-5 shrink-0"
//     aria-hidden="true"
//   />
//   {item.name}
// </div>
//                     </UpgradePlanModal>
//                   );
//                 }
// return (
//   <button
//     key={item.name}
//     onClick={() => router.push(item.href)}
//     disabled={item.disabled}
//     className={cn(
//       item.current
//         ? "bg-gray-200 font-semibold text-foreground dark:bg-secondary"
//         : "duration-200 hover:bg-gray-200 hover:dark:bg-muted",
//       "group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-sm leading-6 disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent",
//     )}
//   >
//     <item.icon
//       className="h-5 w-5 shrink-0"
//       aria-hidden="true"
//     />
//     {item.name}
//   </button>
// );
//               })}
//             </div>
//           </section>
//         </ScrollArea>
//     <div className="mb-4">
//       {/* if user is on trial show banner,
//        * if user is pro show nothing,
//        * if user is free and showProBanner is true show pro banner
//        */}
//       {userPlan === "trial" && session ? (
//         <Banner session={session} />
//       ) : null}
//       {(userPlan === "pro" ||
//         userPlan === "business" ||
//         userPlan === "datarooms") &&
//         null}
//       {userPlan === "free" && showProBanner ? (
//         <ProBanner setShowProBanner={setShowProBanner} />
//       ) : null}

//       <div className="mb-2">
//         {linksLimit ? (
//           <UsageProgress
//             title="Links"
//             unit="links"
//             usage={limits?.usage?.links}
//             usageLimit={linksLimit}
//           />
//         ) : null}
//         {documentsLimit ? (
//           <UsageProgress
//             title="Documents"
//             unit="documents"
//             usage={limits?.usage?.documents}
//             usageLimit={documentsLimit}
//           />
//         ) : null}
//         {linksLimit || documentsLimit ? (
//           <p className="mt-2 px-2 text-xs text-muted-foreground">
//             Change plan to increase usage limits
//           </p>
//         ) : null}
//       </div>

//       <div className="hidden w-full lg:block">
//         <ProfileMenu size="large" />
//       </div>
//     </div>
//   </aside>
// </div>
//   );
// };

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
  const { data: session, status } = useSession();
  const { plan: userPlan, trial: userTrial, loading } = usePlan();
  const isTrial = !!userTrial;
  const { limits } = useLimits();
  const linksLimit = limits?.links;
  const documentsLimit = limits?.documents;

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
        userPlan === "business" ||
        userPlan === "datarooms" ||
        userTrial === "drtrial"
          ? false
          : true,
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
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  P {/*should be replaced by actual logo*/}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex h-16 shrink-0 items-center space-x-3">
                    <span className="flex items-center text-2xl font-bold tracking-tighter text-black dark:text-white">
                      Papermark
                    </span>
                    {userPlan && userPlan != "free" ? (
                      <span className="ml-4 rounded-full bg-background px-2.5 py-1 text-xs tracking-normal text-foreground ring-1 ring-gray-800">
                        {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                      </span>
                    ) : null}
                    {!isTrial ? (
                      <span className="ml-4 rounded-sm bg-foreground px-2 py-0.5 text-xs tracking-normal text-background ring-1 ring-gray-800">
                        Trial
                      </span>
                    ) : null}
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SelectTeam
          currentTeam={currentTeam}
          teams={teams}
          isLoading={isLoading}
          setCurrentTeam={() => {}}
        />
        {/* <NavMain items={navigation} /> */}
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}

        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((item) => {
              if (item.name === "Documents") {
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
                      isActive={item.current}
                      onClick={() => router.push(item.href)}
                    >
                      <a>
                        <item.icon />
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                    {open && item.active ? <SiderbarFolders /> : null}
                  </SidebarMenuItem>
                );
              }
              if (
                userPlan !== "business" &&
                userPlan !== "datarooms" &&
                userTrial !== "drtrial" &&
                item.name === "Datarooms"
              ) {
                return (
                  <UpgradePlanModal
                    key={item.name}
                    clickedPlan={"Business"}
                    trigger={"datarooms"}
                  >
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        className="text-sm leading-6 text-muted-foreground hover:bg-inherit hover:text-muted-foreground"
                        asChild
                        tooltip={item.name}
                        isActive={item.current}
                        onClick={() => router.push(item.href)}
                      >
                        <a>
                          {/* <div className="group flex w-full items-center gap-x-2 rounded-md py-2 ml-2 text-sm leading-6 text-muted-foreground hover:bg-transparent"> */}
                          <item.icon
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                        {/* </div> */}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
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
                  >
                    <a>
                      <item.icon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mb-1">
          {/* if user is on trial show banner,
           * if user is pro show nothing,
           * if user is free and showProBanner is true show pro banner
           */}
          {open && (
            <>
              {userPlan === "trial" && session && <Banner session={session} />}

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
          <ProfileMenu size="large" />
          {/* </div> */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
