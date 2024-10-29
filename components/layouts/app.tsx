import { useIsMobile } from "@/hooks/use-mobile";

import AppSidebar from "@/components/Sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import ProfileMenu from "../profile-menu";
import TrialBanner from "./trial-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black lg:flex-row">
      <SidebarProvider>
        <AppSidebar />
        <div className="h-dvh flex-1">
          {/* Trial banner shown only on trial */}
          <TrialBanner />
          <main className="h-dvh flex-1 lg:p-2">
            <div className="h-full overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800">
              <div className="sticky top-0 z-50 ml-2 bg-white pt-2 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <SidebarTrigger />

                  {isMobile && <ProfileMenu size="small" />}
                </div>
                <Separator />
              </div>

              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
