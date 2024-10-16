import Link from "next/link";

import { useState } from "react";

import AppLayout from "@/components/layouts/app";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ContactsDocumentsTable } from "@/components/visitors/contacts-document-table";

import useViewer from "@/lib/swr/use-viewer";

export default function VisitorDetailPage() {
  const { viewer } = useViewer();
  const views = viewer?.views;

  return (
    <AppLayout>
      <div className="p-4 pb-0 sm:m-4 sm:py-4">
        <section className="mb-4 flex flex-col justify-between md:mb-8 lg:mb-12">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/visitors">All Visitors</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{viewer?.email}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {viewer?.email}
            </h2>
          </div>
        </section>

        <Separator className="mb-2 bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="relative p-4 pt-0 sm:mx-4 sm:mt-4">
        {/* @ts-ignore */}
        <ContactsDocumentsTable views={views} />
      </div>
    </AppLayout>
  );
}
