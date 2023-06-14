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
// @ts-ignore
import type { PutBlobResult } from "@vercel/blob";
import toast from "react-hot-toast";
import Notification from "@/components/Notification";
import DocumentUpload from "@/components/document-upload";


export function AddDocumentModal({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      alert("Please select a file to upload.");
      return; // prevent form from submitting
    }

    const data = new FormData();
    if (currentFile) data.append("file", currentFile);

    try {
      setUploading(true);

      // upload the file to the blob storage
      const blobResponse = await fetch("/api/file/upload", {
        method: "POST",
        body: data,
      });

      if (!blobResponse.ok) {
        throw new Error(`HTTP error! status: ${blobResponse.status}`);
      }

      // get the blob url from the response
      const blob = (await blobResponse.json()) as PutBlobResult;

      // create a document in the database with the blob url
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: blob.pathname,
          url: blob.url,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const document = await response.json();

      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`
      );

      toast.custom((t) => (
        <Notification
          visible={t.visible}
          closeToast={() => toast.dismiss(t.id)}
          message={
            "Document uploaded and link copied to clipboard. Redirecting to document page..."
          }
        />
      ));

      setTimeout(() => {
        router.push("/documents/" + document.id);
      }, 4000);
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="text-white bg-black">
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
              onSubmit={handleSubmit}
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
