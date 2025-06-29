import Cookies from "js-cookie";

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

import { DocumentTabs } from "../document-tabs";
import { BlockingModal } from "./blocking-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isSidebarOpen = Cookies.get(SIDEBAR_COOKIE_NAME) === "true";

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <div className="flex flex-1 flex-col gap-x-1 bg-gray-50 dark:bg-black md:flex-row">
        <AppSidebar />
        <SidebarInset className="ring-1 ring-gray-200 dark:ring-gray-800">
          <DocumentTabs />
          <header className="flex h-10 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <AppBreadcrumb />
            </div>
          </header>
          <TrialBanner />
          <BlockingModal />
          <main className="flex-1" id="main-content">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
