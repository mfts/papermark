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
  const [dataRoomName, setDataRoomName] = useState<string>("");
  //const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  const handleDataroomCreation = async (event: any) => {
    event.preventDefault();
    //set error messages
    if (!dataRoomName) {
      setErrorMessage("Dataroom's name cannot be blank");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }
    if (dataRoomDocuments.length === 0) {
      setErrorMessage("Please select a document to include in dataroom");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    try {
      setUploading(true);

      let response: Response | undefined;
      // Save dataroom to database
      response = await saveDataroomToDatabase();

      if (response) {
        const dataroom = await response.json();

        // copy the link to the clipboard
        copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/${dataroom.id}`, "Dataroom created and link copied to clipboard. Redirecting to datarooms page...")

        // Do we need to track the event ??
        // plausible("dataroomcreated");

        setTimeout(() => {
          //Refresh the page
          location.reload();
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      setUploading(false);
      console.error("An error occurred while creating dataroom: ", error);
    }
  }

  async function saveDataroomToDatabase() {
    //Select documents from useDocuments for maintainig constant type in backend
    const titles = dataRoomDocuments.map((dataRoomDocument) => dataRoomDocument.title);
    const ids = dataRoomDocuments.map((dataRoomDocument) => dataRoomDocument.id);

    const response = await fetch("/api/datarooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: dataRoomName,
        titles,
        ids
      }),
    });

    if (!response.ok) {
      let responseBody = await response.json();
      setErrorMessage(responseBody.message);
      setTimeout(() => setErrorMessage(""), 5000);
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
              <Input
                className="mb-3"
                placeholder={"Enter Data Room Name..."}
                onChange={(e) => { setDataRoomName(e.target.value) }}
              />
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
                ><PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />Add Document </Button>
              </AddDocumentToDataRoomModal>
            </ul>
            <br />
            <div className="flex justify-center ">
              {errorMessage ? <p className="-mt-1 mb-1 text-sm text-muted-foreground font-bold text-red-500">{errorMessage}</p> : <br />}
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full lg:w-1/2"
                disabled={dataRoomDocuments.length === 0}
                loading={uploading}
                onClick={handleDataroomCreation}
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