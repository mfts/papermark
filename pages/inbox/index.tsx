import { tree } from "next/dist/build/templates/app-page";

import { useState } from "react";

import { PlusIcon } from "lucide-react";

import SortButton from "@/components/documents/filters/sort-button";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useInboxLinks } from "@/lib/swr/use-inbox";

export default function Inbox() {
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const { links } = useInboxLinks();
  const handleOpenLinkSheet = () => setIsLinkSheetOpen(true);
  return (
    <AppLayout>
      <div className="sticky top-0 mb-4 min-h-[calc(100vh-72px)] rounded-lg bg-white p-4 dark:bg-gray-900 sm:mx-4 sm:pt-8">
        <section className="mb-4 flex items-center justify-between space-x-2 sm:space-x-0">
          <div className="space-y-0 sm:space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Inbox
            </h2>
            <p className="text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-none">
              Receive and track uploaded files with ease.
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              className="group flex flex-1 items-center justify-start gap-x-1 whitespace-nowrap px-1 text-left sm:gap-x-3 sm:px-3"
              title="New File Request"
              onClick={handleOpenLinkSheet}
            >
              <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-base">New File Request</span>
            </Button>
          </div>
        </section>

        <section id="documents-header-count" />

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />
        <LinkSheet
          linkType="FILE_REQUEST_LINK"
          isOpen={isLinkSheetOpen}
          setIsOpen={setIsLinkSheetOpen}
          existingLinks={links}
        />
        {/* Links */}
        <LinksTable links={links} targetType={"FILE_REQUEST"} />
      </div>
    </AppLayout>
  );
}
