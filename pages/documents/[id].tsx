import { getExtension } from "@/lib/utils";
import { useDocument } from "@/lib/swr/use-document";
import ErrorPage from "next/error";
import StatsCard from "@/components/documents/stats-card";
import StatsChart from "@/components/documents/stats-chart";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import Image from "next/image";
import LinksTable from "@/components/links/links-table";
import VisitorsTable from "@/components/visitors/visitors-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import FileUp from "@/components/shared/icons/file-up";

export default function DocumentPage() {
  const { document, primaryVersion, error } = useDocument();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <AppLayout>
      <div>
        {document && primaryVersion ? (
          <>
            {/* Heading */}
            <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 p-4 sm:flex-row sm:items-center sm:m-4">
              <div className="space-y-2">
                <div className="flex space-x-4 items-center">
                  <div className="w-8">
                    <Image
                      src={`/_icons/${getExtension(primaryVersion.file)}.svg`}
                      alt="File icon"
                      width={50}
                      height={50}
                      className=""
                    />
                  </div>
                  <h2 className="leading-7 text-2xl text-foreground font-semibold tracking-tight">
                    {document.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AddDocumentModal newVersion>
                  <button title="Upload a new version">
                    <FileUp className="w-6 h-6" />
                  </button>
                </AddDocumentModal>
                <Button onClick={() => setIsLinkSheetOpen(true)}>
                  Create Link
                </Button>
              </div>
            </div>
            {/* Stats */}
            {document.numPages !== null && (
              <StatsChart
                documentId={document.id}
                totalPagesMax={primaryVersion.numPages!}
              />
            )}
            <StatsCard />
            {/* Visitors */}
            <VisitorsTable numPages={primaryVersion.numPages!} />
            {/* Links */}
            <LinksTable />
            <LinkSheet
              isOpen={isLinkSheetOpen}
              setIsOpen={setIsLinkSheetOpen}
            />
          </>
        ) : (
          <div className="h-screen flex items-center justify-center">
            <LoadingSpinner className="mr-1 h-20 w-20" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
