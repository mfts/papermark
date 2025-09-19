import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { AppBreadcrumb } from "@/components/layouts/breadcrumb";
import TrialBanner from "@/components/layouts/trial-banner";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SIDEBAR_COOKIE_NAME,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomUser } from "@/lib/types";

import { BlockingModal } from "./blocking-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  const [userHasToggledOnDataroom, setUserHasToggledOnDataroom] = useState(false);
  
  // Check if user is new (created within last 10 seconds, same logic as middleware)
  const isNewUser = session?.user && (session.user as CustomUser).createdAt &&
    new Date((session.user as CustomUser).createdAt!).getTime() > Date.now() - 10000;
  
  // Check if current page is a dataroom page
  const isDataroomPage = router.pathname.startsWith('/datarooms/[id]');
  
  useEffect(() => {
    // Reset user toggle state when navigating away from dataroom
    if (!isDataroomPage) {
      setUserHasToggledOnDataroom(false);
    }
  }, [isDataroomPage]);
  
  useEffect(() => {
    // Get current cookie value
    const cookieValue = Cookies.get(SIDEBAR_COOKIE_NAME);
    
    if (isNewUser) {
      // For new users, always start with sidebar open and update cookie
      setSidebarOpen(true);
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `${SIDEBAR_COOKIE_NAME}=true; path=/; max-age=${maxAge}`;
    } else if (isDataroomPage && !userHasToggledOnDataroom) {
      // For dataroom pages, close the sidebar initially but allow user to override
      setSidebarOpen(false);
    } else {
      // For all other cases, use default behavior (let SidebarProvider handle it)
      setSidebarOpen(null);
    }
  }, [isNewUser, isDataroomPage, userHasToggledOnDataroom]);

  // Use controlled mode when we need to override the sidebar state
  const shouldUseControlledMode = (isNewUser || (isDataroomPage && !userHasToggledOnDataroom));

  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open);
    // If user manually toggles on dataroom page, remember that
    if (isDataroomPage) {
      setUserHasToggledOnDataroom(true);
    }
  };

  return (
    <SidebarProvider 
      {...(shouldUseControlledMode ? { 
        open: sidebarOpen!, 
        onOpenChange: handleSidebarChange 
      } : {})}
    >
      <div className="flex flex-1 flex-col gap-x-1 bg-gray-50 dark:bg-black md:flex-row">
        <AppSidebar />
        <SidebarInset className="ring-1 ring-gray-200 dark:ring-gray-800">
          <header className="flex h-10 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <AppBreadcrumb />
            </div>
          </header>
          <TrialBanner />
          <BlockingModal />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
