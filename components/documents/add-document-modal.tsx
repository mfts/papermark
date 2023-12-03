import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useRouter } from "next/router";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import DocumentUpload from "@/components/document-upload";
import { pdfjs } from "react-pdf";
import { copyToClipboard, getExtension } from "@/lib/utils";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { useTeam } from "@/context/team-context";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function AddDocumentModal({
  newVersion,
  children,
}: {
  newVersion?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const teamInfo = useTeam();

  const handleBrowserUpload = async (event: any) => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      alert("Please select a file to upload.");
      return; // prevent form from submitting
    }

    try {
      setUploading(true);

      const newBlob = await upload(currentFile.name, currentFile, {
        access: "public",
        handleUploadUrl: "/api/file/browser-upload",
      });

      let response: Response | undefined;
      let numPages: number | undefined;
      // create a document or new version in the database if the document is a pdf
      if (getExtension(newBlob.pathname).includes("pdf")) {
        numPages = await getTotalPages(newBlob.url);
        if (!newVersion) {
          // create a document in the database
          response = await saveDocumentToDatabase(newBlob, numPages);
        } else {
          // create a new version for existing document in the database
          const documentId = router.query.id;
          response = await saveNewVersionToDatabase(
            newBlob,
            documentId as string,
            numPages,
          );
        }
      }

      if (response) {
        const document = await response.json();

        console.log("document: ", document);

        if (!newVersion) {
          // copy the link to the clipboard
          copyToClipboard(
            `${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`,
            "Document uploaded and link copied to clipboard. Redirecting to document page...",
          );

          // track the event
          plausible("documentUploaded");

          // redirect to the document page
          setTimeout(() => {
            router.push("/documents/" + document.id);
            setUploading(false);
          }, 2000);
        } else {
          // track the event
          plausible("documentVersionUploaded");
          toast.success("New document version uploaded.");

          // reload to the document page
          setTimeout(() => {
            router.reload();
            setUploading(false);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
    }
  };

  async function saveDocumentToDatabase(
    blob: PutBlobResult,
    numPages?: number,
  ) {
    // create a document in the database with the blob url
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: blob.pathname,
          url: blob.url,
          numPages: numPages,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // create a new version in the database
  async function saveNewVersionToDatabase(
    blob: PutBlobResult,
    documentId: string,
    numPages?: number,
  ) {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}/versions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: blob.url,
          numPages: numPages,
          type: "pdf",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // get the number of pages in the pdf
  async function getTotalPages(url: string): Promise<number> {
    const pdf = await pdfjs.getDocument(url).promise;
    return pdf.numPages;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="text-foreground bg-background">
        <DialogHeader>
          <DialogTitle>
            {newVersion ? `Upload a new version` : `Share a document`}
          </DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                {newVersion
                  ? `After you upload a new version, the existing links will remain the unchanged but `
                  : `After you upload the document, a shareable link will be
                generated and copied to your clipboard.`}
              </p>
            </div>
            <form
              encType="multipart/form-data"
              onSubmit={handleBrowserUpload}
              className="flex flex-col"
            >
              <div className="space-y-12">
                <div className="pb-6">
                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <DocumentUpload
                      currentFile={currentFile}
                      setCurrentFile={setCurrentFile}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full lg:w-1/2"
                  disabled={uploading || !currentFile}
                  loading={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
