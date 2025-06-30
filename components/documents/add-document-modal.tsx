import Link from "next/link";
import { useRouter } from "next/router";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FormEvent, useEffect, useState } from "react";



import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { CheckCircleIcon, Loader2, UploadCloud } from "lucide-react";
import { parsePageId } from "notion-utils";
import { toast } from "sonner";
import { mutate } from "swr";



import { useAnalytics } from "@/lib/analytics";
import { SUPPORTED_DOCUMENT_MIME_TYPES } from "@/lib/constants";
import { useUpload } from "@/lib/context/upload-context";
import {
  DocumentData,
  createDocument,
  createNewDocumentVersion,
} from "@/lib/documents/create-document";
import { putFile } from "@/lib/files/put-file";
import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { getSupportedContentType } from "@/lib/utils/get-content-type";

import DocumentUpload from "@/components/document-upload";
import GoogleDriveIntegration from "@/components/integrations/google-drive/google-drive";
import { useGoogleDriveStatus } from "@/components/integrations/google-drive/google-drive";
import GoogleDrivePicker, {
  GoogleDriveFile,
} from "@/components/integrations/google-drive/google-drive-picker";
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

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { SetGroupPermissionsModal } from "../datarooms/groups/set-group-permissions-modal";
import { ConfirmationDialog } from "../ui/confirmation-dialog";

export interface ProcessedFile {
  folderId: string;
  folderName: string;
  parentFolderId: string | null;
  files: Array<{
    fileId: string;
    fileName: string;
    fileType: string;
    parentId?: string;
    folderPathName?: string;
  }>;
  children?: ProcessedFile[];
}

export interface Files {
  fileId: string;
  fileName: string;
  fileType: string;
  folderPathName: string | undefined;
}

interface DataroomDocument {
  id: string;
  documentId: string;
  dataroomId: string;
}

export function AddDocumentModal({
  newVersion,
  children,
  isDataroom,
  dataroomId,
  setAddDocumentModalOpen,
  openModal,
}: {
  newVersion?: boolean;
  children: React.ReactNode;
  isDataroom?: boolean;
  openModal?: boolean;
  dataroomId?: string;
  setAddDocumentModalOpen?: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const analytics = useAnalytics();
  const [uploading, setUploading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean | undefined>(undefined);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [notionLink, setNotionLink] = useState<string | null>(null);
  const { startUpload } = useUpload();
  const [selectedGoogleDriveFile, setSelectedGoogleDriveFile] = useState<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const teamInfo = useTeam();
  const { canAddDocuments } = useLimits();
  const { plan, trial } = usePlan();
  const isFreePlan = plan === "free";
  const isTrial = !!trial;
  const {
    isConnected,
    googleDriveIntegration,
    isLoading,
    mutate: mutateGoogleDriveIntegration,
  } = useGoogleDriveStatus();

  const [showGroupPermissions, setShowGroupPermissions] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      documentId: string;
      dataroomDocumentId: string;
      fileName: string;
    }[]
  >([]);
  const teamId = teamInfo?.currentTeam?.id as string;
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    totalFiles: number;
    totalFolders: number;
    treeStructure: ProcessedFile;
    filesList: Files[];
  } | null>(null);
  useEffect(() => {
    if (openModal) setIsOpen(openModal);
  }, [openModal]);

  /** current folder name */
  const currentFolderPath = router.query.name as string[] | undefined;

  const addDocumentToDataroom = async ({
    documentId,
    folderPathName,
  }: {
    documentId: string;
    folderPathName?: string;
  }): Promise<Response | undefined> => {
    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: documentId,
            folderPathName: folderPathName,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        toast.error(message);
        return undefined;
      }

      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
      );
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders/documents/${folderPathName}`,
      );

      toast.success("Document added to dataroom successfully! 🎉");
      return response;
    } catch (error) {
      toast.error("Error adding document to dataroom.");
      console.error(
        "An error occurred while adding document to the dataroom: ",
        error,
      );
      return undefined;
    }
  };

  const handleFileUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      toast.error("Please select a file to upload.");
      return; // prevent form from submitting
    }

    if (!canAddDocuments) {
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
        teamId,
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
      // create a document or new version in the database
      if (!newVersion) {
        // create a document in the database
        response = await createDocument({
          documentData,
          teamId,
          numPages,
          folderPathName: currentFolderPath?.join("/"),
        });
      } else {
        // create a new version for existing document in the database
        const documentId = router.query.id as string;
        response = await createNewDocumentVersion({
          documentData,
          documentId,
          numPages,
          teamId,
        });
      }

      if (response) {
        const document = await response.json();

        if (isDataroom && dataroomId) {
          const dataroomResponse = await addDocumentToDataroom({
            documentId: document.id,
            folderPathName: currentFolderPath?.join("/"),
          });

          if (dataroomResponse?.ok) {
            const dataroomDocument =
              (await dataroomResponse.json()) as DataroomDocument & {
                dataroom: { _count: { viewerGroups: number } };
              };

            if (dataroomDocument.dataroom._count.viewerGroups > 0) {
              setShowGroupPermissions(true);
              setUploadedFiles([
                {
                  documentId: document.id,
                  dataroomDocumentId: dataroomDocument.id,
                  fileName: document.name,
                },
              ]);
            }
          }

          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: document.type,
            teamId: teamId,
            dataroomId: dataroomId,
            $set: {
              teamId: teamId,
              teamPlan: plan,
            },
          });

          return;
        }

        if (!newVersion) {
          mutate(`/api/teams/${teamId}/documents`);
          toast.success("Document uploaded. Redirecting to document page...");

          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: document.type,
            teamId: teamId,
            $set: {
              teamId: teamId,
              teamPlan: plan,
            },
          });

          // redirect to the document page
          router.push("/documents/" + document.id);
        } else {
          analytics.capture("Document Added", {
            documentId: document.id,
            name: document.name,
            numPages: document.numPages,
            path: router.asPath,
            type: document.type,
            newVersion: true,
            teamId: teamId,
            $set: {
              teamId: teamId,
              teamPlan: plan,
            },
          });
          toast.success("New document version uploaded.");

          // reload to the document page
          router.reload();
        }
      }
    } catch (error) {
      setUploading(false);
      toast.error("An error occurred while uploading the file.");
      console.error("An error occurred while uploading the file: ", error);
    } finally {
      setUploading(false);
      setIsOpen(false);
      setAddDocumentModalOpen && setAddDocumentModalOpen(false);
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

    if (!canAddDocuments) {
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
        `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
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
          }),
        },
      );

      if (!response.ok) {
        const { error } = await response.json();
        toast.error(error);
        return;
      }

      const document = await response.json();

      if (isDataroom && dataroomId) {
        const dataroomResponse = await addDocumentToDataroom({
          documentId: document.id,
          folderPathName: currentFolderPath?.join("/"),
        });

        if (dataroomResponse?.ok) {
          const dataroomDocument =
            (await dataroomResponse.json()) as DataroomDocument & {
              dataroom: { _count: { viewerGroups: number } };
            };

          if (dataroomDocument.dataroom._count.viewerGroups > 0) {
            setShowGroupPermissions(true);
            setUploadedFiles([
              {
                documentId: document.id,
                dataroomDocumentId: dataroomDocument.id,
                fileName: document.name,
              },
            ]);
          }
        }

        analytics.capture("Document Added", {
          documentId: document.id,
          name: document.name,
          numPages: document.numPages,
          path: router.asPath,
          type: "notion",
          teamId: teamId,
          dataroomId: dataroomId,
          $set: {
            teamId: teamId,
            teamPlan: plan,
          },
        });

        return;
      }

      if (!newVersion) {
        toast.success("Notion Page processed. Redirecting to document page...");

        analytics.capture("Document Added", {
          documentId: document.id,
          name: document.name,
          fileSize: null,
          path: router.asPath,
          type: "notion",
          teamId: teamId,
          $set: {
            teamId: teamId,
            teamPlan: plan,
          },
        });

        // redirect to the document page
        router.push("/documents/" + document.id);
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
      setIsOpen(false);
    }
  };

  const processItems = async (
    items: GoogleDriveFile[],
    processedFiles?: ProcessedFile,
  ): Promise<{ processedFiles: ProcessedFile; files: Files[] }> => {
    let rootFolderFiles: Files[] = [];
    const folderIds: string[] = [];

    for (const item of items) {
      if (item.type === "folder") {
        folderIds.push(item.id);
      } else {
        rootFolderFiles.push({
          fileId: item.id,
          fileName: item.name,
          fileType: item.mimeType,
          folderPathName: currentFolderPath?.join("/"),
        });
      }
    }
    let children: ProcessedFile[] = [];
    let files: Files[] = [];
    if (folderIds.length > 0) {
      try {
        const response = await fetch(
          "/api/integrations/google-drive/list-files",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderIds,
              folderPathName: currentFolderPath?.join("/"),
              teamId,
              dataroomId,
            }),
          },
        );
        if (!response.ok) {
          const error = await response.json();
          if (error.requiresReconnect) {
            toast.error("Google Drive connection expired. Please reconnect.");
            const fallbackProcessedFiles: ProcessedFile = processedFiles || {
              folderId: "root",
              folderName: "Root",
              parentFolderId: null,
              files: rootFolderFiles,
              children: [],
            };
            return {
              processedFiles: fallbackProcessedFiles,
              files: [...rootFolderFiles, ...files],
            };
          }
          throw new Error(error.message || "Failed to list files");
        }
        const data: { tree: ProcessedFile[]; files: Files[] } =
          await response.json();
        files = [...rootFolderFiles, ...data.files];
        children.push(...data.tree);
      } catch (error) {
        console.error("Error processing Google Drive file:", error);
        toast.error("Failed to process file from Google Drive");
        const fallbackProcessedFiles: ProcessedFile = processedFiles || {
          folderId: "root",
          folderName: "Root",
          parentFolderId: null,
          files: rootFolderFiles,
          children: [],
        };
        return {
          processedFiles: fallbackProcessedFiles,
          files: [...rootFolderFiles, ...files],
        };
      }
    }
    if (folderIds.length === 0) {
      files = [...rootFolderFiles];
    }
    processedFiles = {
      folderId: "root",
      folderName: "Root",
      parentFolderId: null,
      files: rootFolderFiles,
      children: children,
    };
    return { processedFiles, files: files };
  };

  const handleGoogleDriveFileSelect = async (files: GoogleDriveFile[]) => {
    if (!files.length) {
      toast.error("No files selected from Google Drive");
      return;
    }

    setUploading(true);

    try {
      const processPromise = processItems(files);
      toast.promise(processPromise, {
        loading: "Getting files from Google Drive...",
        success: "Files processed successfully",
        error: "Failed to process files from Google Drive",
      });

      const { processedFiles: treeStructure, files: filesList } =
        await processPromise;

      // Count files and folders
      const totalFiles = filesList.length;
      const totalFolders = countFolders(treeStructure);
      setConfirmDialogData({
        totalFiles,
        totalFolders,
        treeStructure,
        filesList,
      });
      setShowConfirmDialog(true);
      setUploading(false);
    } catch (error) {
      console.error("Error processing Google Drive files:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process files from Google Drive";
      toast.error(errorMessage);
      setUploading(false);
    }
  };

  const handleUploadConfirm = async () => {
    if (!confirmDialogData) return;
    setIsOpen(false);
    setUploading(true);
    try {
      await startUpload({
        treeFiles: confirmDialogData.treeStructure,
        path: currentFolderPath?.join("/"),
        dataroomId,
        filesList: confirmDialogData.filesList,
        teamId,
      });
      setAddDocumentModalOpen && setAddDocumentModalOpen(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload files";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setShowConfirmDialog(false);
      setConfirmDialogData(null);
    }
  };

  // Helper function to count folders in the tree structure
  const countFolders = useCallback((tree: ProcessedFile): number => {
    let count = 0;
    if (tree.children && tree.children.length > 0) {
      count += tree.children.length;
      tree.children.forEach((child) => {
        count += countFolders(child);
      });
    }
    return count;
  }, []);

  const handleGoogleDriveError = (error: Error) => {
    console.error("Google Drive error:", error);
    toast.error("Failed to select file from Google Drive");
  };

  const clearModelStates = () => {
    currentFile !== null && setCurrentFile(null);
    notionLink !== null && setNotionLink(null);
    selectedGoogleDriveFile !== null && setSelectedGoogleDriveFile(null);
    setIsOpen(!isOpen);
    setAddDocumentModalOpen && setAddDocumentModalOpen(!isOpen);
  };

  if (!canAddDocuments && children) {
    if (newVersion) {
      return (
        <UpgradePlanModal
          clickedPlan={PlanEnum.Pro}
          trigger={"limit_upload_document_version"}
        >
          {children}
        </UpgradePlanModal>
      );
    }
    return (
      <UpgradePlanModal
        clickedPlan={PlanEnum.Pro}
        trigger={"limit_upload_documents"}
      >
        <Button>Upgrade to Add Documents</Button>
      </UpgradePlanModal>
    );
  }

  return (
    <>
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
            {!newVersion ? (
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="document">Document</TabsTrigger>
                <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
                <TabsTrigger value="notion">Notion Page</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="document">Document</TabsTrigger>
              </TabsList>
            )}
            <TabsContent value="document">
              <Card>
                <CardHeader className="space-y-3">
                  <CardTitle>
                    {newVersion ? `Upload a new version` : `Share a document`}
                  </CardTitle>
                  <CardDescription>
                    {newVersion ? (
                      `After you upload a new version, the existing links will remain the unchanged.`
                    ) : (
                      <span>
                        After you upload the document, create a shareable link.{" "}
                        {isFreePlan && !isTrial ? (
                          <>
                            Upload larger files and more{" "}
                            <Link
                              href="https://www.papermark.com/help/article/document-types"
                              target="_blank"
                              className="underline underline-offset-4 transition-all hover:text-muted-foreground/80 hover:dark:text-muted-foreground/80"
                            >
                              file types
                            </Link>{" "}
                            with a higher plan.
                          </>
                        ) : null}
                      </span>
                    )}
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
                        />
                      </div>
                    </div>

                    {!newVersion ? (
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
                    ) : null}

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
            <TabsContent value="google-drive">
              <Card className="rounded-lg shadow-lg">
                <CardHeader className="space-y-3">
                  <CardTitle className="flex items-center text-xl font-bold">
                    <UploadCloud className="mr-2 text-blue-500" />
                    {newVersion
                      ? `Upload from Google Drive`
                      : `Import from Google Drive`}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {isConnected || !isLoading
                      ? "Select a file from your Google Drive to import"
                      : "Sync your Google Drive account to import files"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isConnected ? (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="flex w-full items-center space-x-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        <span>
                          <span className="font-medium">
                            Google Drive connected.
                          </span>{" "}
                          Select a file to import.
                        </span>
                      </div>
                      <GoogleDrivePicker
                        onFileSelect={handleGoogleDriveFileSelect}
                        onError={handleGoogleDriveError}
                        accessToken={
                          googleDriveIntegration?.integration.accessToken || ""
                        }
                        isConnected={isConnected}
                        setAddDocumentModalOpen={setIsOpen}
                        fileTypes={SUPPORTED_DOCUMENT_MIME_TYPES}
                        isDriveLoading={isLoading}
                        mutate={mutateGoogleDriveIntegration}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <GoogleDriveIntegration className="flex-col gap-y-6" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {!newVersion && (
              <TabsContent value="notion">
                <Card>
                  <CardHeader className="space-y-3">
                    <CardTitle>Share a Notion Page</CardTitle>
                    <CardDescription>
                      After you submit the Notion link, a shareable link will be
                      generated and copied to your clipboard. Just like with a
                      PDF document.
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
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
      {confirmDialogData && (
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setConfirmDialogData(null);
          }}
          onConfirm={handleUploadConfirm}
          title="Confirm Upload"
          totalFiles={confirmDialogData.totalFiles}
          totalFolders={confirmDialogData.totalFolders}
          confirmText="Upload"
          cancelText="Cancel"
          loading={uploading}
        />
      )}
      {showGroupPermissions && dataroomId && (
        <SetGroupPermissionsModal
          open={showGroupPermissions}
          setOpen={setShowGroupPermissions}
          dataroomId={dataroomId}
          uploadedFiles={uploadedFiles}
          onComplete={() => {
            setShowGroupPermissions(false);
            setAddDocumentModalOpen?.(false);
            setUploadedFiles([]);
          }}
          isAutoOpen
        />
      )}
    </>
  );
}