import { signOut, useSession } from "next-auth/react";
import ChevronUp from "@/components/shared/icons/chevron-up";
import Link from "next/link";
import Image from "next/image";
import UserRound from "./shared/icons/user-round";
import { ModeToggle } from "./theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  className?: string;
  size: "large" | "small";
};

const ProfileMenu = ({ className, size }: ProfileMenuProps) => {
  const { data: session, status } = useSession();

  const isSize = size === "large";
  return (
    <div className="flex justify-between items-center space-x-2">
      {status === "loading" ? (
        <div className="w-full flex items-center rounded-md gap-x-3 p-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          {isSize && <Skeleton className="h-7 w-[90%]" />}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="w-full">
            <div className="w-full flex items-center group rounded-full lg:rounded-md lg:gap-x-3 lg:p-2 text-sm font-semibold leading-6 text-foreground hover:bg-gray-200 hover:dark:bg-secondary">
              {session?.user?.image ? (
                <Image
                  className="h-7 w-7 rounded-full bg-secondary"
                  src={session?.user?.image}
                  width={30}
                  height={30}
                  alt={`Profile picture of ${session?.user?.name}`}
                  loading="lazy"
                />
              ) : (
                <UserRound className="h-7 w-7 p-1 rounded-full ring-1 ring-muted-foreground/50 bg-secondary" />
              )}
              {isSize && (
                <span className="flex items-center w-full justify-between">
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true" className="line-clamp-2">
                    {session?.user?.name
                      ? session?.user?.name
                      : session?.user?.email?.split("@")[0]}
                  </span>
                  <ChevronUp
                    className="ml-2 h-5 w-5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                </span>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="lg:w-[240px] xl:w-[270px] mr-2 lg:mr-0 px-0 pb-2">
            {session ? (
              <>
                <DropdownMenuLabel className="px-3 !py-[3px] mt-2 text-sm text-muted-foreground truncate">
                  {session?.user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="!my-2" />
                <ModeToggle />

                <a
                  href="mailto:support@papermark.io"
                  className="flex items-center px-3 py-2 my-1 text-sm hover:bg-gray-200 dark:hover:bg-muted duration-200"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Need Help?
                </a>

                <Link
                  onClick={() =>
                    signOut({
                      callbackUrl: `${window.location.origin}`,
                    })
                  }
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-muted duration-200"
                  href={""}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Link>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default ProfileMenu;
