import Link from "next/link";
import { useRouter } from "next/router";

import { FormEvent, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { DefaultPermissionStrategy } from "@prisma/client";
import { parsePageId } from "notion-utils";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import { useAnalytics } from "@/lib/analytics";
import {
  DocumentData,
  createDocument,
  createNewDocumentVersion,
} from "@/lib/documents/create-document";
import { putFile } from "@/lib/files/put-file";
import { useDataroomPermissions } from "@/lib/hooks/use-dataroom-permissions";
import { getNotionPageIdFromSlug } from "@/lib/notion/utils";
import { usePlan } from "@/lib/swr/use-billing";
import { useDataroom } from "@/lib/swr/use-dataroom";
import useLimits from "@/lib/swr/use-limits";
import { getSupportedContentType } from "@/lib/utils/get-content-type";

import { SetUnifiedPermissionsModal } from "@/components/datarooms/groups/set-unified-permissions-modal";
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

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";

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
  const [showGroupPermissions, setShowGroupPermissions] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      documentId: string;
      dataroomDocumentId: string;
      fileName: string;
    }[]
  >([]);
  const teamInfo = useTeam();
  const { canAddDocuments } = useLimits();
  const { plan, isFree, isTrial } = usePlan();
  const { dataroom } = useDataroom();
  const teamId = teamInfo?.currentTeam?.id as string;

  const { applyPermissions } = useDataroomPermissions();

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

  const toastErrorMessage = () =>
    toast.error(
      "Failed to apply default permissions. Update the group permissions in the group settings.",
    );

  const applyUnifiedPermissionsToDocument = async (
    document: any,
    dataroomDocument: DataroomDocument & {
      dataroom: {
        _count: { viewerGroups: number; permissionGroups: number };
      };
    },
    currentFolderPath?: string[],
  ): Promise<void> => {
    const hasAnyGroups =
      dataroomDocument.dataroom._count.viewerGroups > 0 ||
      dataroomDocument.dataroom._count.permissionGroups > 0;

    if (!hasAnyGroups) return;

    const strategy =
      dataroom?.defaultPermissionStrategy ||
      DefaultPermissionStrategy.INHERIT_FROM_PARENT;

    if (strategy === DefaultPermissionStrategy.ASK_EVERY_TIME) {
      setShowGroupPermissions(true);
      setUploadedFiles([
        {
          documentId: document.id,
          dataroomDocumentId: dataroomDocument.id,
          fileName: document.name,
        },
      ]);
    } else if (strategy === DefaultPermissionStrategy.INHERIT_FROM_PARENT) {
      const isRootLevel = !currentFolderPath || currentFolderPath.length === 0;

      try {
        const result = await applyPermissions(
          dataroomId!,
          [document.id],
          "INHERIT_FROM_PARENT",
          isRootLevel ? undefined : currentFolderPath?.join("/"),
          toastErrorMessage,
        );

        if (!result.success) {
          console.error("Failed to apply permissions:", result.error);
          toastErrorMessage();
        }
      } catch (error) {
        console.error("Failed to apply permissions:", error);
        toastErrorMessage();
      }
    }
    // strategy === DefaultPermissionStrategy.HIDDEN_BY_DEFAULT - do nothing, documents remain hidden
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
                dataroom: {
                  _count: { viewerGroups: number; permissionGroups: number };
                };
              };

            await applyUnifiedPermissionsToDocument(
              document,
              dataroomDocument,
              currentFolderPath,
            );
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

    // Check if the field is empty or not
    if (!notionLink) {
      toast.error("Please enter a Notion link to proceed.");
      return; // prevent form from submitting
    }

    // Validate URL format with Zod
    const urlSchema = z.string().url();
    const urlValidation = urlSchema.safeParse(notionLink);

    if (!urlValidation.success) {
      toast.error("Please enter a valid URL format.");
      return;
    }

    // Try to validate the Notion page URL
    let validateNotionPageId = parsePageId(notionLink);

    // If parsePageId fails, try to get page ID from slug
    if (validateNotionPageId === null) {
      try {
        const pageId = await getNotionPageIdFromSlug(notionLink);
        validateNotionPageId = pageId || undefined;
      } catch (slugError) {
        toast.error("Please enter a valid Notion link to proceed.");
        return;
      }
    }

    if (!validateNotionPageId) {
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
              dataroom: {
                _count: { viewerGroups: number; permissionGroups: number };
              };
            };

          await applyUnifiedPermissionsToDocument(
            document,
            dataroomDocument,
            currentFolderPath,
          );
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

  const clearModelStates = () => {
    currentFile !== null && setCurrentFile(null);
    notionLink !== null && setNotionLink(null);
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="document">Document</TabsTrigger>
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
                        {isFree && !isTrial ? (
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

      {showGroupPermissions && dataroomId && (
        <SetUnifiedPermissionsModal
          open={showGroupPermissions}
          setOpen={setShowGroupPermissions}
          dataroomId={dataroomId}
          uploadedFiles={uploadedFiles}
          onComplete={() => {
            setShowGroupPermissions(false);
            setAddDocumentModalOpen?.(false);
            setUploadedFiles([]);
          }}
        />
      )}
    </>
  );
}
