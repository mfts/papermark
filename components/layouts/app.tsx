import { AppSidebar } from "@/components/sidebar/app-sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { SidebarProvider } from "../ui/sidebar";
import TrialBanner from "./trial-banner";

export default function AppLayout({
  breadcrumbs,
  children,
}: {
  breadcrumbs?: { title: string; href: string }[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex flex-1 flex-col gap-x-1 bg-gray-50 dark:bg-black lg:flex-row">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-10 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              {breadcrumbs && (
                <>
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.length > 1 &&
                        breadcrumbs.slice(0, -1).map((breadcrumb, index) => (
                          <BreadcrumbItem
                            key={index}
                            className="hidden md:block"
                          >
                            <BreadcrumbLink href={breadcrumb.href}>
                              {breadcrumb.title}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        ))}
                      {breadcrumbs.length > 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {breadcrumbs[breadcrumbs.length - 1].title}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </>
              )}
            </div>
          </header>
          {/* Trial banner shown only on trial */}
          <TrialBanner />
          <main className="flex-1">
            {/* <div className="overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800"> */}
            {children}
            {/* </div> */}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
