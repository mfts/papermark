import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useState } from "react";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import DocumentUpload from "@/components/document-upload";
import {
  ArrowRightIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Skeleton from "../Skeleton";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { pdfjs } from "react-pdf";
import { copyToClipboard, getExtension } from "@/lib/utils";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";
import { useTeam } from "@/context/team-context";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function Upload() {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
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
                    disabled={uploading || !currentFile}
                  >
                    {uploading ? "Uploading..." : "Upload Document"}
                  </Button>
                </div>
              </form>
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
                      {/* <button
                        type="button"
                        className="relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold bg-accent ring-1 ring-inset ring-accent hover:ring-gray-400 animate-pulse"
                        title="Copy link"
                        onClick={() => handleCopyToClipboard(currentLinkId)}
                      >
                        <DocumentDuplicateIcon
                          className="h-5 w-5 text-accent-foreground"
                          aria-hidden="true"
                        />
                      </button> */}
                    </div>
                  </div>
                  <div className="flex items-center justify-center mb-4">
                    <Button
                      onClick={() => handleContinue(currentLinkId)}
                      type="submit"
                      // disabled={!copiedLink}
                    >
                      {"Share Document"}
                      {/* <ArrowRightIcon className="h-4 w-4 ml-2" /> */}
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
