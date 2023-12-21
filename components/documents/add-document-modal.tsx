import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import DocumentUpload from "@/components/document-upload";
import { pdfjs } from "react-pdf";
import { copyToClipboard, getExtension } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { useTeam } from "@/context/team-context";
import { parsePageId } from "notion-utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function AddDocumentModal({
  newVersion,
  children,
}: {
  newVersion?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [notionLink, setNotionLink] = useState<string | null>(null);
  const teamInfo = useTeam();

  const handleBrowserUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      toast.error("Please select a file to upload.");
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
      // create a document or new version in the database if the document is a pdf
      if (getExtension(newBlob.pathname).includes("pdf")) {
        numPages = await getTotalPages(newBlob.url);
        if (!newVersion) {
          // create a document in the database
          response = await saveDocumentToDatabase(newBlob, numPages);
        } else {
          // create a new version for existing document in the database
          const documentId = router.query.id;
          response = await saveNewVersionToDatabase(
            newBlob,
            documentId as string,
            numPages,
          );
        }
      }

      if (response) {
        const document = await response.json();

        if (!newVersion) {
          // copy the link to the clipboard
          copyToClipboard(
            `${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`,
            "Document uploaded and link copied to clipboard. Redirecting to document page...",
          );

          // track the event
          plausible("documentUploaded");

          // redirect to the document page
          setTimeout(() => {
            router.push("/documents/" + document.id);
            setUploading(false);
          }, 2000);
        } else {
          // track the event
          plausible("documentVersionUploaded");
          toast.success("New document version uploaded.");

          // reload to the document page
          setTimeout(() => {
            router.reload();
            setUploading(false);
          }, 2000);
        }
      }
    } catch (error) {
      setUploading(false);
      toast.error("An error occurred while uploading the file.");
      console.error("An error occurred while uploading the file: ", error);
    } finally {
      setUploading(false);
    }
  };

  async function saveDocumentToDatabase(
    blob: PutBlobResult,
    numPages?: number,
  ) {
    // create a document in the database with the blob url
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: blob.pathname,
          url: blob.url,
          numPages: numPages,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // create a new version in the database
  async function saveNewVersionToDatabase(
    blob: PutBlobResult,
    documentId: string,
    numPages?: number,
  ) {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}/versions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: blob.url,
          numPages: numPages,
          type: "pdf",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // get the number of pages in the pdf
  async function getTotalPages(url: string): Promise<number> {
    const pdf = await pdfjs.getDocument(url).promise;
    return pdf.numPages;
  }

  const handleNotionUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
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
            name: "Notion Link", // TODO: get the title of the notion page
            url: notionLink,
            numPages: 1,
            type: "notion",
          }),
        },
      );

      if (response) {
        const document = await response.json();

        if (!newVersion) {
          // copy the link to the clipboard
          copyToClipboard(
            `${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`,
            "Notion Page processed and link copied to clipboard. Redirecting to document page...",
          );

          // track the event
          plausible("documentUploaded");
          plausible("notionDocumentUploaded");

          // redirect to the document page
          setTimeout(() => {
            router.push("/documents/" + document.id);
            setUploading(false);
          }, 2000);
        }
      }
    } catch (error) {
      setUploading(false);
      toast.error("An error occurred while processing the Notion link.");
      console.error(
        "An error occurred while processing the Notion link: ",
        error,
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="text-foreground bg-transparent border-none shadow-none"
        isDocumentDialog
      >
        <Tabs defaultValue="document">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="notion">Notion Page</TabsTrigger>
          </TabsList>
          <TabsContent value="document">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle>
                  {newVersion ? `Upload a new version` : `Share a document`}
                </CardTitle>
                <CardDescription>
                  {newVersion
                    ? `After you upload a new version, the existing links will remain the unchanged but `
                    : `After you upload the document, a shareable link will be
                generated and copied to your clipboard.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <form
                  encType="multipart/form-data"
                  onSubmit={handleBrowserUpload}
                  className="flex flex-col"
                >
                  <div className="space-y-1">
                    <div className="pb-6">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        <DocumentUpload
                          currentFile={currentFile}
                          setCurrentFile={setCurrentFile}
                        />
                      </div>
                    </div>
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
                <CardTitle>Share a Notion Page</CardTitle>
                <CardDescription>
                  After you submit the Notion link, a shareable link will be
                  generated and copied to your clipboard. Just like with a PDF
                  document.
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
                        className="flex w-full rounded-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
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
