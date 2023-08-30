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
import { put, type PutBlobResult } from "@vercel/blob";
import DocumentUpload from "@/components/document-upload";
import { pdfjs } from "react-pdf";
import { copyToClipboard, getExtension } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function AddDocumentModal({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleBrowserUpload = async (event: any) => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      alert("Please select a file to upload.");
      return; // prevent form from submitting
    }

    try {
      setUploading(true);

      const newBlob = await put(currentFile.name, currentFile, {
        access: "public",
        handleBlobUploadUrl: "/api/file/browser-upload",
      });

      let response: Response | undefined;
      let numPages: number | undefined;
      // create a document in the database if the document is a pdf
      if (getExtension(newBlob.pathname).includes("pdf")) {
        numPages = await getTotalPages(newBlob.url);
        response = await saveDocumentToDatabase(newBlob, numPages);
      } else {
        response = await saveDocumentToDatabase(newBlob);
      }

      if (response) {
        const document = await response.json();

        copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`, "Document uploaded and link copied to clipboard. Redirecting to document page...")

        setTimeout(() => {
          router.push("/documents/" + document.id);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
    }
  }

  async function saveDocumentToDatabase(blob: PutBlobResult, numPages?: number) {
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

  // get the number of pages in the pdf
  async function getTotalPages(url: string): Promise<number> {
    const pdf = await pdfjs.getDocument(url).promise;
    return pdf.numPages;
  };

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="text-white bg-black ring-1 ring-white/10">
        <DialogHeader>
          <DialogTitle>Share a document</DialogTitle>
          <DialogDescription>
            <div className="border-b border-gray-800 py-2">
              <p className="mt-1 text-sm text-gray-400">
                After you upload the document, a shareable link will be
                generated and copied to your clipboard.
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
                <button
                  type="submit"
                  className="rounded-md bg-gray-100 px-3 py-2 w-full lg:w-1/2 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:text-gray-100 hover:bg-gray-500 disabled:text-gray-400 disabled:bg-gray-800 disabled:cursor-not-allowed"
                  disabled={uploading || !currentFile}
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
