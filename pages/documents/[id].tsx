import { getExtension } from "@/lib/utils";
import { useDocument } from "@/lib/swr/use-document";
import ErrorPage from "next/error";
import StatsCard from "@/components/documents/stats-card";
import StatsChart from "@/components/documents/stats-chart";
import LinkSheet from "@/components/links/link-sheet";
import Image from "next/image";
import LinksTable from "@/components/links/links-table";
import VisitorsTable from "@/components/visitors/visitors-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Eye from "@/components/shared/icons/eye";
import * as Tooltip from "@radix-ui/react-tooltip";
import { PreviewDocumentModal } from "@/components/documents/preview-document-modal";
import AppLayout from "@/components/layouts/app";

export default function DocumentPage() {
  const { document, error } = useDocument();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState(false);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  const handlePreview = () => {
    setModalOpen(true)
  }

  return (
    <>
      <AppLayout>
        <div>
          {document ? (
            <>
              {/* Heading */}
              <div className="
              flex flex-col items-start justify-between gap-x-8
               gap-y-4 p-4 sm:flex-row sm:items-center sm:m-4">

                <div className="space-y-2">
                  <div className="flex space-x-4 items-center">
                    <div className="w-8">
                      <Image
                        src={`/_icons/${getExtension(document.file)}.svg`}
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

                <div className="w-fit space-x-10 flex items-center justify-between">

                {/* Feel free to make it a small component */}
                  <Tooltip.Provider>
                    <Tooltip.Root delayDuration={0}>

                      <Tooltip.Trigger asChild>
                        <div onClick={handlePreview}
                          className="w-10 p-1 h-7 flex justify-center
                         items-center hover:bg-orange-100">
                          <Eye className="w-6 h-6 text-slate-400 hover:cursor-pointer" />
                        </div>
                      </Tooltip.Trigger>

                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="TooltipContent p-1 px-2 font-light  bg-slate-800 text-slate-200"
                          sideOffset={5}>
                          Preview
                          <Tooltip.Arrow className="TooltipArrow" />
                        </Tooltip.Content>
                      </Tooltip.Portal>

                    </Tooltip.Root>
                  </Tooltip.Provider>

                  <Button onClick={() => setIsLinkSheetOpen(true)}>
                    Create Link
                  </Button>
                </div>


              </div>
              {/* Stats */}
              {document.numPages !== null && (
              <StatsChart
                documentId={document.id}
                totalPages={document.numPages}
              />
            )}
            <StatsCard />
              {/* Visitors */}
              <VisitorsTable numPages={document.numPages!} />
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

      </AppLayout >

      {
        isModalOpen
        &&
        document?.file
        &&
        < PreviewDocumentModal
          file={document.file}
          numPages={document.numPages}
          setOpen={setModalOpen}
        />
      }

    </>
  );
}
