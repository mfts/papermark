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
import { copyToClipboard, getExtension } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useRouter } from "next/router";
import { Separator } from "@/components/ui/separator";
import PasswordSection from "@/components/links/link-sheet/password-section";
import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import { DEFAULT_DATAROOM_TYPE, DEFAULT_DATAROOM_PROPS } from "../paged/add-paged-dataroom-modal";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function AddHierarchicalDataroomModal({ children }: { children: React.ReactNode }) {
  //Documents inside data room
  const [dataRoomName, setDataRoomName] = useState<string>("");
  const [dataRoomDescription, setDataRoomDescription] = useState<string>("");
  const [data, setData] = useState<DEFAULT_DATAROOM_TYPE>(DEFAULT_DATAROOM_PROPS);

  //const plausible = usePlausible();
  const [loading, setLoading] = useState<boolean>(false);
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

    try {
      setLoading(true);

      let response: Response | undefined;
      // Save dataroom to database
      response = await saveDataroomToDatabase();

      if (response) {
        const data = await response.json();

        // copy the link to the clipboard
        copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/${data.dataroom.id}/${data.homeFolder.id}`, "Dataroom created and link copied to clipboard. Redirecting to dataroom's page...")

        // Do we need to track the event ??
        // plausible("dataroomcreated");

        setTimeout(() => {
          //Refresh the page
          router.push(`/datarooms/${data.dataroom.id}/${data.homeFolder.id}`)
          setLoading(false);
        }, 2000);
      }
    } catch (error) {
      setLoading(false);
      console.error("An error occurred while creating dataroom: ", error);
    }
  }

  async function saveDataroomToDatabase() {
    const response = await fetch("/api/datarooms/hierarchical", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: dataRoomName,
        description: dataRoomDescription,
        password: data.password ? data.password : "",
        emailProtected: data.emailProtected
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
          <DialogTitle>Create a hierarchical dataroom</DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                Please enter the name and description of dataroom.
                After you create a dataroom, a shareable link will be
                generated and copied to your clipboard.
              </p>
            </div>
            <div className="py-2 mt-1">
              <p className="mb-1 text-sm text-muted-foreground font-bold mb-1">
                Dataroom Name
              </p>
              <Input
                placeholder={"Enter Data Room Name..."}
                onChange={(e) => { setDataRoomName(e.target.value) }}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-bold mb-1">
                Dataroom Description
              </p>
              <Input
                className="mb-2"
                placeholder={"Enter Data Room Description..."}
                onChange={(e) => { setDataRoomDescription(e.target.value) }}
              />
            </div>
            <div className="flex items-center relative">
              <Separator className="bg-muted-foreground absolute" />
              <div className="relative mx-auto">
                <span className="px-2 bg-background text-muted-foreground text-sm">
                  Optional
                </span>
              </div>
            </div>

            <div>
              <EmailProtectionSection {...{ data, setData }} />
              <PasswordSection {...{ data, setData }} />
            </div>
            <div className="flex justify-center ">
              {errorMessage ? <p className="-mt-1 mb-1 text-sm text-muted-foreground font-bold text-red-500">{errorMessage}</p> : <br />}
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full lg:w-1/2"
                loading={loading}
                onClick={handleDataroomCreation}
              >
                {loading ? "Creating Data Room..." : "Create Data Room"}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}