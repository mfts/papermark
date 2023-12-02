import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTeam } from "@/context/team-context";
import { getExtension } from "@/lib/utils";
import { PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { usePlausible } from "next-plausible";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Accept } from "react-dropzone";
import AvatarEditor from "react-avatar-editor";
import DocumentUpload from "../document-upload";
import { Slider } from "@/components/ui/slider";
import { Undo } from "lucide-react";
import { Redo } from "lucide-react";

export function AddLogoModal({
  open,
  setOpen,
  onAddition,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAddition?: (newDomain: string) => void;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [scale, setScale] = useState<number[]>([90]);
  const [rotate, setRotate] = useState<number>(0);
  const teamInfo = useTeam();
  const editor = useRef<AvatarEditor>(null);
  const acceptedFileFormats: Accept = {
    "image/png": [".png"],
    "image/jpg": [".jpg"],
    "image/jpeg": [".jpeg"],
  };
  const accetedFileTypes = ["png", "jpg", "jpeg"];

  const handleBrowserUpload = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if the file is chosen
    if (!currentFile) {
      alert("Please select a file to upload.");
      return; // prevent form from submitting
    }

    try {
      setUploading(true);

      let editedFile;
      if (editor && editor.current) {
        const blob = await new Promise<Blob | null>((resolve) => {
          editor?.current
            ?.getImage()
            .toBlob((blob) => resolve(blob), "image/png");
        });

        if (blob) {
          // Create a File object from the Blob
          editedFile = new File([blob], "edited_avatar.png", {
            type: "image/png",
          });
        }
      }

      const newBlob = await upload(
        currentFile.name,
        editedFile ? editedFile : currentFile,
        {
          access: "public",
          handleUploadUrl: "/api/file/browser-upload",
        },
      );

      let response: Response | undefined;
      // create a document or new version in the database if the document is a pdf
      if (
        accetedFileTypes.some((fileType) =>
          getExtension(newBlob.pathname).includes(fileType),
        )
      ) {
        // create a new version for existing document in the database
        const documentId = router.query.id;
        response = await saveLogoToDatabase(newBlob);
      }

      if (response) {
        const document = await response.json();

        console.log("document: ", document);
        // track the event
        plausible("documentVersionUploaded");

        toast.success("Logo added successfully! 🎉");
        onAddition && onAddition(document);

        !onAddition && window.open("/settings/logo", "_blank");

        // reload to the document page
        setTimeout(() => {
          router.reload();
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error("An error occurred while uploading the logo: ", error);
    }
  };

  async function saveLogoToDatabase(blob: PutBlobResult) {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/logo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: blob.url,
          name: blob.pathname,
          type: "pdf",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  const handleScaleChange = (newValue: number[]) => {
    setScale(newValue);
  };

  const rotatePreviewImage = (rotateDirection: number) => {
    setRotate((prev) => prev + rotateDirection * 30);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Logo</DialogTitle>
          <DialogDescription>
            You can easily add a custom logo.
          </DialogDescription>
        </DialogHeader>
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
                  acceptedFileTypes={accetedFileTypes}
                  AcceptedFormats={acceptedFileFormats}
                  maxFileSizeInMB={30}
                />
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-center pb-6">
              {currentFile ? (
                <AvatarEditor
                  ref={editor}
                  scale={scale[0] * 0.01}
                  width={200}
                  height={80}
                  // position={state.position}
                  // onPositionChange={handlePositionChange}
                  rotate={rotate}
                  borderRadius={2}
                  // backgroundColor={state.backgroundColor}
                  // onLoadFailure={logCallback.bind(this, "onLoadFailed")}
                  // onLoadSuccess={logCallback.bind(this, "onLoadSuccess")}
                  // onImageReady={logCallback.bind(this, "onImageReady")}
                  image={currentFile !== null ? currentFile : "EmptyFile"}
                  // disableCanvasRotation={state.disableCanvasRotation}
                />
              ) : (
                ""
              )}
            </div>
            <div className="flex justify-center pb-6">
              {currentFile ? (
                <div className="flex space-x-1">
                  {" "}
                  <Button
                    className="my-4 h-8 rounded-full px-1 text-xs py-1"
                    type="button"
                    onClick={() => rotatePreviewImage(1)}
                  >
                    <Redo />
                  </Button>
                  <Slider
                    value={scale}
                    onValueChange={handleScaleChange}
                    className="my-6 px-4 py-2"
                    orientation="horizontal"
                  />
                  <Button
                    className="my-4 h-8 rounded-full px-1 text-xs py-1"
                    type="button"
                    onClick={() => rotatePreviewImage(-1)}
                  >
                    <Undo />
                  </Button>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              className="w-full lg:w-1/2"
              disabled={uploading || !currentFile}
              loading={uploading}
            >
              {uploading ? "Uploading..." : "Upload Logo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
