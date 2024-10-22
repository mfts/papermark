import AppSidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import TrialBanner from "./trial-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-gray-50 dark:bg-black lg:flex-row">
      <SidebarProvider>
        <AppSidebar />
        <div className="h-dvh flex-1">
          {/* Trial banner shown only on trial */}
          <TrialBanner />
          <main className="h-dvh flex-1 lg:p-2">
            <SidebarTrigger />
            <div className="h-full overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
