import Link from "next/link";
import { useRouter } from "next/router";

import { FormEvent, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LimitProps } from "@/ee/limits/swr-handler";
import { PlanEnum } from "@/ee/stripe/constants";
import { Document } from "@prisma/client";
import { usePlausible } from "next-plausible";
import { parsePageId } from "notion-utils";
import { toast } from "sonner";
import { mutate } from "swr";

import DocumentUpload from "@/components/document-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAnalytics } from "@/lib/analytics";
import {
  DocumentData,
  createDocument,
  createNewDocumentVersion,
} from "@/lib/documents/create-document";
import { putFile } from "@/lib/files/put-file";
import { isPlanTrial } from "@/lib/swr/use-billing";
import { LinkWithRequestFile } from "@/lib/types";
import { getSupportedContentType } from "@/lib/utils/get-content-type";

interface FileRequestUploadModalProps {
  children: React.ReactNode;
  openModal?: boolean;
  setAddDocumentModalOpen?: (isOpen: boolean) => void;
  link: LinkWithRequestFile;
  viewerId: string;
  onUploadSuccess?: (document: Document) => void;
  currentFolderPath?: string[];
  isFolder?: boolean;
  isDataroomFolder?: boolean;
  limits: LimitProps | null;
  remainingFileSize: number;
  viewId?: string;
}

export function FileRequestUploadModal({
  children,
  setAddDocumentModalOpen,
  openModal,
  link,
  viewerId,
  onUploadSuccess,
  currentFolderPath,
  isFolder,
  isDataroomFolder,
  limits,
  remainingFileSize,
  viewId,
}: FileRequestUploadModalProps) {
  const router = useRouter();
  const plausible = usePlausible();
  const analytics = useAnalytics();
  const [uploading, setUploading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean | undefined>(undefined);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [notionLink, setNotionLink] = useState<string | null>(null);

  useEffect(() => {
    if (openModal) setIsOpen(openModal);
  }, [openModal]);

  const clearModelStates = () => {
    currentFile !== null && setCurrentFile(null);
    notionLink !== null && setNotionLink(null);
    setIsOpen(!isOpen);
    setAddDocumentModalOpen && setAddDocumentModalOpen(!isOpen);
  };

  const handleFileUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!currentFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (remainingFileSize === 0) {
      toast.error("You have reached the maximum number of documents.");
      return;
    }

    try {
      setUploading(true);

      let contentType = currentFile.type;
      let supportedFileType = getSupportedContentType(contentType);

      if (
        currentFile.name.endsWith(".dwg") ||
        currentFile.name.endsWith(".dxf")
      ) {
        supportedFileType = "cad";
        contentType = `image/vnd.${currentFile.name.split(".").pop()}`;
      }

      if (currentFile.name.endsWith(".xlsm")) {
        supportedFileType = "sheet";
        contentType = "application/vnd.ms-excel.sheet.macroEnabled.12";
      }

      if (!supportedFileType) {
        setUploading(false);
        toast.error(
          "Unsupported file format. Please upload a PDF, Powerpoint, Excel, Word or image file.",
        );
        return;
      }

      const { type, data, numPages, fileSize } = await putFile({
        file: currentFile,
        teamId: link.teamId,
        viewerId,
      });

      const documentData: DocumentData = {
        name: currentFile.name,
        key: data!,
        storageType: type!,
        contentType: contentType,
        supportedFileType: supportedFileType,
        fileSize: fileSize,
      };

      let response: Response | undefined;

      // create a document in the database
      response = await createDocument({
        documentData,
        teamId: link.teamId,
        numPages,
        folderPathName: currentFolderPath?.join("/"),
        createLink: false,
        viewerId: viewerId,
        approvalStatus: link.requireApproval ? "PENDING" : "APPROVED",
        uploadedViaLinkId: link.id,
        dataroomId: link.dataroomFolder?.dataroomId || undefined,
        viewId: viewId,
      });

      if (response) {
        const document = await response.json();
        if (isDataroomFolder && link.dataroomFolder.dataroomId) {
          plausible("documentUploaded");
          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: document.type,
            teamId: link.teamId,
            dataroomId: link.dataroomFolder.dataroomId,
            viewerId: viewerId,
            $set: {
              teamId: link.teamId,
              teamPlan: link.team.plan,
            },
          });
        } else {
          // TODO: track the event
          plausible("documentUploaded");
          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: document.type,
            teamId: link.teamId,
            viewerId: viewerId,
            $set: {
              teamId: link.teamId,
              teamPlan: link.team.plan,
            },
          });
        }
        onUploadSuccess?.(document);
        toast.success("Document uploaded successfully!");
      }
    } catch (error) {
      setUploading(false);
      toast.error("An error occurred while uploading the file.");
      console.error("An error occurred while uploading the file: ", error);
    } finally {
      setUploading(false);
      clearModelStates();
    }
  };

  const createNotionFileName = () => {
    // Extract Notion file name from the URL
    const urlSegments = (notionLink as string).split("/")[3];
    // Remove the last hyphen along with the Notion ID
    const extractName = urlSegments.replace(/-([^/-]+)$/, "");
    const notionFileName = extractName.replaceAll("-", " ") || "Notion Link";

    return notionFileName;
  };

  const handleNotionUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (remainingFileSize === 0) {
      toast.error("You have reached the maximum number of documents.");
      return;
    }
    const validateNotionPageURL = parsePageId(notionLink);
    // Check if it's a valid URL or not by Regx
    const isValidURL =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}([a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+)?$/;

    // Check if the field is empty or not
    if (!notionLink) {
      toast.error("Please enter a Notion link to proceed.");
      return; // prevent form from submitting
    }
    if (validateNotionPageURL === null || !isValidURL.test(notionLink)) {
      toast.error("Please enter a valid Notion link to proceed.");
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(
        `/api/teams/${link.teamId}/documents/viewer/${viewerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: createNotionFileName(),
            url: notionLink,
            numPages: 1,
            type: "notion",
            createLink: false,
            folderPathName: currentFolderPath?.join("/"),
            approvalStatus: link.requireApproval ? "PENDING" : "APPROVED",
            uploadedViaLinkId: link.id,
            dataroomId: link.dataroomFolder?.dataroomId || undefined,
          }),
        },
      );

      if (response) {
        const document = await response.json();
        onUploadSuccess?.(document);
        plausible("documentUploaded");
        plausible("notionDocumentUploaded");
        if (isDataroomFolder && link.dataroomFolder.dataroomId) {
          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: "notion",
            teamId: link.teamId,
            dataroomId: link.dataroomFolder.dataroomId,
            $set: {
              teamId: link.teamId,
              teamPlan: link.team.plan,
            },
          });
        } else {
          plausible("documentUploaded");
          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: "notion",
            teamId: link.teamId,
            $set: {
              teamId: link.teamId,
              teamPlan: link.team.plan,
            },
          });
        }
      }
    } catch (error) {
      setUploading(false);
      toast.error(
        "Oops! Can't access the Notion page. Please double-check it's set to 'Public'.",
      );
      console.error(
        "An error occurred while processing the Notion link: ",
        error,
      );
    } finally {
      setUploading(false);
      clearModelStates();
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={clearModelStates}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="border-none bg-transparent text-foreground shadow-none"
        isDocumentDialog
      >
        <DialogTitle className="sr-only">Add Document</DialogTitle>
        <DialogDescription className="sr-only">
          An overlayed modal that can be clicked to upload a document
        </DialogDescription>
        <Tabs defaultValue="document">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="notion">Notion Page</TabsTrigger>
          </TabsList>
          <TabsContent value="document">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle>Upload a document</CardTitle>
                <CardDescription>
                  Upload a document to the document request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <form
                  encType="multipart/form-data"
                  onSubmit={handleFileUpload}
                  className="flex flex-col space-y-4"
                >
                  <div className="space-y-1">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      <DocumentUpload
                        currentFile={currentFile}
                        setCurrentFile={setCurrentFile}
                        plan={link.team.plan}
                        limits={limits}
                        trial={isPlanTrial(link.team.plan)}
                        notShowUpdateToast={true}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground underline-offset-4 transition-all hover:text-gray-800 hover:underline hover:dark:text-muted-foreground/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        document
                          .getElementById("upload-multi-files-zone")
                          ?.click();
                        clearModelStates();
                      }}
                    >
                      Want to upload multiple files?
                    </button>
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
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notion">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle>Upload a Notion Page</CardTitle>
                <CardDescription>
                  Upload a Notion page to the document request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <form
                  encType="multipart/form-data"
                  onSubmit={handleNotionUpload}
                  className="flex flex-col"
                >
                  <div className="space-y-1 pb-8">
                    <Label htmlFor="notion-link">Notion Page Link</Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="notion-link"
                        id="notion-link"
                        placeholder="notion.site/..."
                        className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                        value={notionLink || ""}
                        onChange={(e) => setNotionLink(e.target.value)}
                      />
                    </div>
                    <small className="text-xs text-muted-foreground">
                      Your Notion page needs to be shared publicly.
                    </small>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="w-full lg:w-1/2"
                      disabled={uploading || !notionLink}
                      loading={uploading}
                    >
                      {uploading ? "Saving..." : "Save Notion Link"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
