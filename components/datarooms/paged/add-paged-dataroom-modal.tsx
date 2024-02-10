import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { pdfjs } from "react-pdf";
import { copyToClipboard } from "@/lib/utils";
import { Button } from "../../ui/button";
import { usePlausible } from "next-plausible";
import { PlusIcon } from "lucide-react";
import { Input } from "../../ui/input";
import { AddDocumentToDataroomModal } from "./add-document-to-dataroom-modal";
import DocumentMetadataCard from "./document-metadata-card";
import Skeleton from "@/components/Skeleton";
import { type DataroomDocument } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import PasswordSection from "@/components/links/link-sheet/password-section";
import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import { useTeam } from "@/context/team-context";

export const DEFAULT_DATAROOM_PROPS = {
  id: null,
  name: null,
  description: null,
  password: null,
  emailProtected: true,
};

export type DEFAULT_DATAROOM_TYPE = {
  id: string | null;
  name: string | null;
  description: string | null;
  password: string | null;
  emailProtected: boolean;
};

export function AddPagedDataroomModal({
  children,
}: {
  children: React.ReactNode;
}) {
  //Documents inside Dataroom
  const [dataroomDocuments, setDataroomDocuments] = useState<
    DataroomDocument[]
  >([]);
  const [dataroomName, setDataroomName] = useState<string>("");
  const [dataroomDescription, setDataroomDescription] = useState<string>("");
  const [data, setData] = useState<DEFAULT_DATAROOM_TYPE>(
    DEFAULT_DATAROOM_PROPS,
  );

  //const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const teamInfo = useTeam();

  const handleDataroomCreation = async (event: any) => {
    event.preventDefault();
    //set error messages
    if (!dataroomName) {
      setErrorMessage("Dataroom's name cannot be blank");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }
    if (dataroomDocuments.length === 0) {
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
        copyToClipboard(
          `${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/paged/${dataroom.id}`,
          "Dataroom created and link copied to clipboard. Redirecting to datarooms page...",
        );

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
  };

  async function saveDataroomToDatabase() {
    //Select documents from useDocuments for maintaining constant type in backend
    const titles = dataroomDocuments.map(
      (dataroomDocument) => dataroomDocument.title,
    );
    const links = dataroomDocuments.map(
      (dataroomDocument) => dataroomDocument.url,
    );

    const response = await fetch("/api/datarooms/paged", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: dataroomName,
        description: dataroomDescription,
        titles,
        links,
        password: data.password ? data.password : "",
        emailProtected: data.emailProtected,
        teamId: teamInfo?.currentTeam?.id,
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
          <DialogTitle>Create single page dataroom</DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                Please select the documents to be included in the dataroom
              </p>
            </div>
            <div className="py-2 mt-1">
              <p className="mb-1 text-sm text-muted-foreground font-bold mb-1">
                Dataroom Name
              </p>
              <Input
                placeholder={"Enter Dataroom Name..."}
                onChange={(e) => {
                  setDataroomName(e.target.value);
                }}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-bold mb-1">
                Dataroom Description
              </p>
              <Input
                className="mb-2"
                placeholder={"Enter Dataroom Description..."}
                onChange={(e) => {
                  setDataroomDescription(e.target.value);
                }}
              />
            </div>

            {/* Documents list */}
            <ul role="list" className={`space-y-4 overflow-y-auto max-h-48`}>
              {dataroomDocuments
                ? dataroomDocuments.map((dataroomDocument) => {
                    return (
                      <DocumentMetadataCard
                        title={dataroomDocument.title}
                        url={dataroomDocument.url}
                        type={dataroomDocument.type}
                        setDataroomDocuments={setDataroomDocuments}
                      />
                    );
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
              <AddDocumentToDataroomModal
                dataroomDocuments={dataroomDocuments}
                setDataroomDocuments={setDataroomDocuments}
              >
                <Button type="button" className="w-full" disabled={false}>
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Document{" "}
                </Button>
              </AddDocumentToDataroomModal>
            </ul>
            <div className="flex items-center relative">
              <Separator className="bg-muted-foreground absolute" />
              <div className="relative mx-auto">
                <span className="px-2 bg-background text-muted-foreground text-sm">
                  Optional
                </span>
              </div>
            </div>

            <div className="-mb-2">
              <EmailProtectionSection {...{ data, setData }} />
              <PasswordSection {...{ data, setData }} />
            </div>
            <br />
            <div className="flex justify-center ">
              {errorMessage && (
                <p className="-mt-1 mb-1 text-sm text-muted-foreground font-bold text-red-500">
                  {errorMessage}
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full lg:w-1/2"
                disabled={dataroomDocuments.length === 0}
                loading={uploading}
                onClick={handleDataroomCreation}
              >
                {uploading ? "Creating Dataroom..." : "Create Dataroom"}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
