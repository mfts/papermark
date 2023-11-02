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
import { mutate } from "swr";
import { toast } from "sonner";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { DialogProps } from "@radix-ui/react-dialog";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function AddUpdateDocumentModal({
  children,
  open,
  setOpen,
  onUpdate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdate?: (
    updatedDocument: DocumentWithLinksAndLinkCountAndViewCount
  ) => void;
}) {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { id } = router.query as {
    id: string;
  };

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
      // create a document in the database if the document is a pdf
      if (getExtension(newBlob.pathname).includes("pdf")) {
        numPages = await getTotalPages(newBlob.url);
        response = id
          ? await updateDocumentInDatabase(newBlob, numPages)
          : await saveDocumentToDatabase(newBlob, numPages);
      } else {
        response = id
          ? await updateDocumentInDatabase(newBlob)
          : await saveDocumentToDatabase(newBlob);
      }

      if (response) {
        const document = await response.json();

        // track the event
        plausible("documentUploaded");

        if (id) {
          setUploading(false);
          setCurrentFile(null);
          setOpen && setOpen(false);
          toast.success("Document file updated successfully");
          const { links: _links, _count, ...documentWithVersion } = document;
          mutate(
            `/api/documents/${encodeURIComponent(id)}`,
            documentWithVersion,
            false
          );
          onUpdate && onUpdate(document);
        } else {
          // copy the link to the clipboard
          copyToClipboard(
            `${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`,
            "Document uploaded and link copied to clipboard. Redirecting to document page..."
          );

          setTimeout(() => {
            router.push("/documents/" + document.id);
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
    numPages?: number
  ) {
    // create a document in the database with the blob url
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: blob.pathname,
        url: blob.url,
        numPages: numPages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async function updateDocumentInDatabase(
    blob: PutBlobResult,
    numPages?: number
  ) {
    // update document in the database
    const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: blob.pathname,
        url: blob.url,
        numPages: numPages,
      }),
    });

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

  const dialogProps: Pick<DialogProps, "onOpenChange" | "open"> = {};

  if (setOpen) {
    dialogProps.onOpenChange = setOpen;
  }

  if (open !== undefined) {
    dialogProps.open = open;
  }

  return (
    <Dialog {...dialogProps}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="text-foreground bg-background" {...(id && {"aria-describedby":undefined})}>
        <DialogHeader>
          <DialogTitle>
            {id ? "Update document" : "Share a document"}
          </DialogTitle>
        </DialogHeader>
        {!id ? (
          <div className="border-b border-border py-2">
            <DialogDescription className="mb-1">
              After you upload the document, a shareable link will be generated
              and copied to your clipboard.
            </DialogDescription>
          </div>
        ) : null}
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
      </DialogContent>
    </Dialog>
  );
}
