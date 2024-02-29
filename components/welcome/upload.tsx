import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useState } from "react";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import DocumentUpload from "@/components/document-upload";
import { toast } from "sonner";
import Skeleton from "../Skeleton";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { pdfjs } from "react-pdf";
import {
  convertDataUrlToFile,
  copyToClipboard,
  getExtension,
  uploadImage,
} from "@/lib/utils";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";
import { useTeam } from "@/context/team-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { LinkOptions } from "../links/link-sheet/link-options";
import { DEFAULT_LINK_PROPS, DEFAULT_LINK_TYPE } from "../links/link-sheet";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function Upload() {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [linkData, setLinkData] =
    useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);
  const teamInfo = useTeam();

  const handleBrowserUpload = async (event: any) => {
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
      
      setCurrentFile(null);
      setCurrentBlob(true);

      let response: Response | undefined;
      let numPages: number | undefined;
      // create a document in the database if the document is a pdf
      if (getExtension(newBlob.pathname).includes("pdf")) {
        numPages = await getTotalPages(newBlob.url);
        response = await saveDocumentToDatabase(newBlob, numPages);
      } else {
        response = await saveDocumentToDatabase(newBlob);
      }

      if (response) {
        const document = await response.json();
        const linkId = document.links[0].id;

        // track the event
        plausible("documentUploaded");

        setTimeout(() => {
          setCurrentDocId(document.id);
          setCurrentLinkId(linkId);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
      setCurrentFile(null);
      setUploading(false);
    }
  };

  const saveDocumentToDatabase = async (
    blob: PutBlobResult,
    numPages?: number,
  ) => {
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
  };

  // get the number of pages in the pdf
  async function getTotalPages(url: string): Promise<number> {
    const pdf = await pdfjs.getDocument(url).promise;
    return pdf.numPages;
  }

  const handleContinue = (id: string) => {
    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`,
      "Link copied to clipboard. Redirecting to document page...",
    );
    setTimeout(() => {
      router.push(`/documents/${currentDocId}`);
      setUploading(false);
    }, 2000);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);

    // Upload the image if it's a data URL
    let blobUrl: string | null =
      linkData.metaImage && linkData.metaImage.startsWith("data:")
        ? null
        : linkData.metaImage;
    if (linkData.metaImage && linkData.metaImage.startsWith("data:")) {
      // Convert the data URL to a blob
      const blob = convertDataUrlToFile({ dataUrl: linkData.metaImage });
      // Upload the blob to vercel storage
      blobUrl = await uploadImage(blob);
      setLinkData({ ...linkData, metaImage: blobUrl });
    }

    const response = await fetch(`/api/links/${currentLinkId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...linkData,
        metaImage: blobUrl,
        documentId: currentDocId,
      }),
    });

    if (!response.ok) {
      // handle error with toast message
      const { error } = await response.json();
      toast.error(error);
      setIsLoading(false);
      return;
    }

    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${currentLinkId}`,
      "Link copied to clipboard. Redirecting to document page...",
    );

    router.push(`/documents/${currentDocId}`);
    setIsLoading(false);
  };

  return (
    <>
      {!currentBlob && (
        <motion.div
          className="z-10 flex flex-col space-y-10 text-center"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            show: {
              opacity: 1,
              scale: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={{ duration: 0.3, type: "spring" }}
        >
          <motion.div
            variants={STAGGER_CHILD_VARIANTS}
            className="flex flex-col items-center space-y-10 text-center"
          >
            <h1 className="font-display text-3xl font-semibold text-foreground transition-colors sm:text-4xl">
              {`Upload your ${router.query.type}`}
            </h1>
          </motion.div>
          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            <main className="mt-8">
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
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="w-full"
                    loading={uploading}
                    disabled={!currentFile}
                  >
                    {uploading ? "Uploading..." : "Upload Document"}
                  </Button>
                </div>
              </form>

              <div className="text-xs text-muted-foreground">
                <span>Use our</span>{" "}
                <Button
                  variant="link"
                  className="text-xs font-normal px-0 underline text-muted-foreground hover:text-gray-700"
                  onClick={async () => {
                    const response = await fetch(
                      "/_example/papermark-example-document.pdf",
                    );
                    const blob = await response.blob();
                    const file = new File(
                      [blob],
                      "papermark-example-document.pdf",
                      {
                        type: "application/pdf",
                      },
                    );
                    setCurrentFile(file);
                  }}
                >
                  sample document
                </Button>
              </div>
            </main>
          </motion.div>
        </motion.div>
      )}

      {currentBlob && (
        <motion.div
          className="z-10 flex flex-col space-y-10 text-center"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            show: {
              opacity: 1,
              scale: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={{ duration: 0.3, type: "spring" }}
        >
          <motion.div
            variants={STAGGER_CHILD_VARIANTS}
            className="flex flex-col items-center space-y-10 text-center"
          >
            <h1 className="font-display text-3xl font-semibold text-foreground transition-colors sm:text-4xl">
              Share your unique link
            </h1>
          </motion.div>

          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            {!currentLinkId && (
              <main className="min-h-[300px]">
                <div className="flex flex-col justify-center">
                  <div className="flex py-8">
                    <div className="flex w-full focus-within:z-10">
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                </div>
              </main>
            )}
            {currentLinkId && currentDocId && (
              <main className="min-h-[300px]">
                <div className="flex flex-col justify-center">
                  <div className="relative">
                    <div className="flex py-8">
                      <div className="flex w-full max-w-xs sm:max-w-lg focus-within:z-10">
                        <p className="block w-full md:min-w-[500px] rounded-md px-4 text-left border-0 py-1.5 text-secondary-foreground bg-secondary leading-6 overflow-y-scroll">
                          {`${process.env.NEXT_PUBLIC_BASE_URL}/view/${currentLinkId}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-xs sm:max-w-lg pb-8">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="py-0 rounded-lg space-x-2">
                          <span className="text-sm font-medium leading-6 text-foreground">
                            Configure Link Options
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="first:pt-5">
                          <LinkOptions data={linkData} setData={setLinkData} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <div className="flex items-center justify-center mb-4">
                    <Button onClick={handleSubmit} loading={isLoading}>
                      Share Document
                    </Button>
                  </div>
                </div>
              </main>
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
