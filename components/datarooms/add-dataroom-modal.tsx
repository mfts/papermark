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
import { upload } from '@vercel/blob/client';
import { pdfjs } from "react-pdf";
import { copyToClipboard, getExtension } from "@/lib/utils";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Input } from "../ui/input";
import { AddDocumentToDataRoomModal } from "./add-document-to-dataroom-modal";
import DocumentMetadataCard from "./document-metadata-card";
import Skeleton from "@/components/Skeleton";
import { type DataroomDocument } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function AddDataRoomModal({ children }: { children: React.ReactNode }) {
  //Documents inside data room
  const [dataRoomDocuments, setDataRoomDocuments] = useState<DataroomDocument[]>([]);
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  console.log("Inside add dataroom modal");
  console.log(dataRoomDocuments)

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
        response = await saveDataroomToDatabase(newBlob, numPages);
      } else {
        response = await saveDataroomToDatabase(newBlob);
      }

      if (response) {
        const document = await response.json();

        // copy the link to the clipboard
        copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`, "Document uploaded and link copied to clipboard. Redirecting to document page...")

        // track the event
        plausible("documentUploaded");

        setTimeout(() => {
          router.push("/documents/" + document.id);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
    }
  }

  async function saveDataroomToDatabase(blob: PutBlobResult, numPages?: number) {
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

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="text-foreground bg-background">
        <DialogHeader>
          <DialogTitle>Create a data room</DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                Please select the documents to be included in the data room.
                After you create a data room, a shareable link will be
                generated and copied to your clipboard.
              </p>
            </div>
            <div className="border-b border-border py-2  mt-3">
              <p className="mb-1 text-sm text-muted-foreground font-bold mb-3">
                Dataroom Name
              </p>
              <Input className="mb-3" placeholder={"Enter Data Room Name..."}></Input>
            </div>

             {/* Documents list */}
            <ul role="list" className="space-y-4">
              {dataRoomDocuments
                ? dataRoomDocuments.map((dataRoomDocument) => {
                    return <DocumentMetadataCard
                    title={dataRoomDocument.title}
                    url={dataRoomDocument.url}
                    type={dataRoomDocument.type}
                    setDataRoomDocuments={setDataRoomDocuments} />;
                  })
                : Array.from({ length: 3 }).map((_, i) => (
                    <li
                      key={i}
                      className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
                    >
                      <Skeleton key={i} className="h-5 w-20" />
                      <Skeleton key={i} className="mt-3 h-3 w-10" />
                    </li>
                  ))}
            </ul>
            <ul className="flex justify-center mt-3">
              <AddDocumentToDataRoomModal
                dataRoomDocuments={dataRoomDocuments}
                setDataRoomDocuments={setDataRoomDocuments}
              >
                <Button
                  type="button"
                  className="w-full"
                  disabled={false} 
                  loading={uploading}
                ><PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />Add Document </Button>
              </AddDocumentToDataRoomModal>
            </ul>
            <br />
            <br />
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full lg:w-1/2"
                disabled={dataRoomDocuments.length===0}
                loading={uploading}
              >
                {uploading ? "Creating Data Room..." : "Create Data Room"}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}