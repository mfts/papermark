import Link from "next/link";

import { HelpCircle, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import ChevronUp from "@/components/shared/icons/chevron-up";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { ModeToggle } from "./theme-toggle";

type ProfileMenuProps = {
  className?: string;
  size: "large" | "small";
};

const ProfileMenu = ({ className, size }: ProfileMenuProps) => {
  const { data: session, status } = useSession();
  const { isMobile } = useSidebar();
  const isSize = size === "large";
  return (
    <div className="flex items-center justify-between space-x-2">
      {status === "loading" ? (
        <div className="flex w-full items-center gap-x-3 rounded-md p-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          {isSize && <Skeleton className="h-7 w-[90%]" />}
        </div>
      ) : (
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      width={30}
                      height={30}
                      alt={`Profile picture of ${session?.user?.name}`}
                      loading="lazy"
                    />
                    <AvatarFallback className="size-8 rounded-full">
                      {session?.user?.name?.slice(0, 2)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                align="end"
                sideOffset={4}
              >
                {session ? (
                  <>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm font-medium">
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate text-xs">
                            {session?.user?.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ModeToggle />
                    <a
                      href="mailto:support@papermark.io"
                      className="my-1 flex items-center px-3 py-2 text-sm duration-200 hover:bg-gray-200 dark:hover:bg-muted"
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Need Help?
                    </a>

                    <Link
                      onClick={() =>
                        signOut({
                          callbackUrl: `${window.location.origin}`,
                        })
                      }
                      className="flex items-center px-3 py-2 text-sm duration-200 hover:bg-gray-200 dark:hover:bg-muted"
                      href={""}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Link>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </div>
  );
};

export default ProfileMenu;
