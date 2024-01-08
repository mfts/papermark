import React from "react";
import { ModeToggle } from "../theme-toggle";
import MobileSideBar from "./MobileSidebar";
import { DropdownMenu , DropdownMenuContent , DropdownMenuItem , DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import Image from "next/image";
import UserRound from "../shared/icons/user-round";
import { signOut } from "next-auth/react";

export default function MobileHeader({ session, userPlan }: { session: Session | null, userPlan: undefined | string }) {
  return (
    <>
      <div className="sticky top-0 z-40 mb-1 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-50/90 bg-gray-50 dark:border-black/10 dark:bg-black/95 px-4 sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
        <MobileSideBar userPlan={userPlan}/>
        <div className="flex flex-1 gap-x-4 self-stretch items-center lg:gap-x-6 justify-end">
          <div className="flex items-center gap-x-4 lg:gap-x-6">  
            {/* Profile dropdown */}
            <MobileProfileMenu session={session} />
            {/* Theme toggle */}
            <ModeToggle />
          </div>
        </div>
      </div>
    </>
  );
}

function MobileProfileMenu({ session }: { session: Session | null }) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span className="sr-only">Open user menu</span>
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
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {session ? (
            <>
              <DropdownMenuItem disabled>
                <p>{session?.user?.email}</p>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  signOut({
                    callbackUrl: `${window.location.origin}`,
                  })
                }
              >
                Sign Out
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
