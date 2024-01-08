import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import ChevronUp from "@/components/shared/icons/chevron-up";
import Link from "next/link";
import { ModeToggle } from "../theme-toggle";
import Banner from "../banner";
import ProBanner from "../billing/pro-banner";
import Cookies from "js-cookie";
import { usePlan } from "@/lib/swr/use-billing";
import Image from "next/image";
import UserRound from "../shared/icons/user-round";
import { Session } from "next-auth";
import MobileHeader from "./MobileHeader";
import SidebarSkeleton from "./SidebarSkeleton";
import SidebarContent from "./SidebarContent";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const { plan, loading } = usePlan();
  const [showProBanner, setShowProBanner] = useState<boolean | null>(null);

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
          {/* sidebar content */}
          <SidebarContent userPlan={userPlan}/> 

          {/* banner and profile menu */}
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

            <div className="flex justify-between items-center space-x-2">
              <ProfileMenu session={session} />
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:pl-72">
        {/* Mobile sidebar */}
        <MobileHeader session={session} userPlan={userPlan}/>
      </div>
    </>
  );
}

function ProfileMenu({ session }: { session: Session | null }) {
  return (
    <>
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
              <DropdownMenuItem disabled>
                <div className="w-full">{session?.user?.email}</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Help?</DropdownMenuItem>
              <DropdownMenuItem className="text-muted-foreground">
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
    </>
  );
}
