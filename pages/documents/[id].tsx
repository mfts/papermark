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
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { PreviewDocumentModal } from "@/components/documents/preview-document-modal";
import { TooltipBox } from "@/components/ui/tooltip";
import Eye from "@/components/shared/icons/eye";

export default function DocumentPage() {
  const { document, primaryVersion, error } = useDocument();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const nameRef = useRef<HTMLHeadingElement>(null);
  const enterPressedRef = useRef<boolean>(false);

  const handleNameSubmit = async () => {
    if (enterPressedRef.current) {
      enterPressedRef.current = false;
      return;
    }
    if (nameRef.current && isEditingName) {
      const newName = nameRef.current.innerText;

      if (newName !== document!.name) {
        const response = await fetch(
          `/api/documents/${document!.id}/update-name`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newName,
            }),
          }
        );

        if (response.ok) {
          const { message } = await response.json();
          toast.success(message);
        } else {
          const { message } = await response.json();
          toast.error(message);
        }
      }
      setIsEditingName(false);
    }
  };

  const preventEnterAndSubmit = (
    event: React.KeyboardEvent<HTMLHeadingElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default line break
      setIsEditingName(true);
      enterPressedRef.current = true;
      handleNameSubmit(); // Handle the submit
      if (nameRef.current) {
        nameRef.current.blur(); // Remove focus from the h2 element
      }
    }
  };

  const handlePreview = () => {
    setModalOpen(true)
  }

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
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
                    <div className="flex flex-col">
                      <h2
                        className="leading-7 text-2xl text-foreground font-semibold tracking-tight hover:cursor-text"
                        ref={nameRef}
                        contentEditable={true}
                        onFocus={() => setIsEditingName(true)}
                        onBlur={handleNameSubmit}
                        onKeyDown={preventEnterAndSubmit}
                        title="Click to edit"
                        dangerouslySetInnerHTML={{ __html: document.name }}
                      />
                      {isEditingName && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {`You are editing the document name. Press <Enter> to save.`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Doc Previw */}
                <div className="w-fit space-x-10 flex items-center justify-between">
                  <TooltipBox title="Preview">
                    <div onClick={handlePreview}
                      className="w-10 p-1 h-7 flex justify-center
                         items-center hover:bg-orange-100">
                      <Eye className="w-6 h-6 text-slate-400 hover:cursor-pointer" />
                    </div>
                  </TooltipBox>
                  <Button onClick={() => setIsLinkSheetOpen(true)}>
                    Create Link
                  </Button>
                </div>
              </div>
              {/* Stats */}
              {document.numPages !== null && (
                <StatsChart
                  documentId={document.id}
                  totalPages={primaryVersion.numPages!}
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

      {
        isModalOpen &&
        document?.file &&
        < PreviewDocumentModal
          file={document.file}
          numPages={document.numPages}
          setOpen={setModalOpen}
        />
      }

    </>
  );
}
