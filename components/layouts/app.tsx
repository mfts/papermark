import { useRouter } from "next/router";

import { useIsMobile } from "@/hooks/use-mobile";

import AppSidebar from "@/components/Sidebar";
import { BreadcrumbComponent } from "@/components/documents/breadcrumb";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import ProfileMenu from "../profile-menu";
import TrialBanner from "./trial-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const isDocumentsPage = router.pathname.startsWith("/documents");
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black lg:flex-row">
      <SidebarProvider>
        <AppSidebar />
        <div className="h-dvh flex-1">
          {/* Trial banner shown only on trial */}
          <TrialBanner />
          <main className="h-100dvh flex-1 lg:h-dvh lg:p-2">
            <div className="h-full overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800">
              {/* <div className="sticky top-0 z-50 ml-2 bg-white pt-2 dark:bg-gray-900"> */}
              {/* <div className="flex items-center justify-between"> */}
              {/* <SidebarTrigger /> */}

              {/* {isMobile && <ProfileMenu size="small" />} */}
              {/* </div> */}
              {/* <Separator /> */}
              {/* </div> */}

              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />

                    {isDocumentsPage && (
                      <>
                        <Separator
                          orientation="vertical"
                          className="mr-2 h-4"
                        />
                        <BreadcrumbComponent />
                      </>
                    )}
                  </div>
                </header>
                {children}
              </SidebarInset>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
