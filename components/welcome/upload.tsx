import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useState } from "react";
import { put, type PutBlobResult } from "@vercel/blob";
import DocumentUpload from "@/components/document-upload";
import { ArrowRightIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Skeleton from "../Skeleton";
import { STAGGER_CHILD_VARIANTS } from "@/lib/contants";
import { pdfjs } from "react-pdf";
import { getExtension } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function Upload() {
  const router = useRouter();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleBrowserUpload = async (event: any) => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      alert("Please select a file to upload.");
      return; // prevent form from submitting
    }

    try {
      setUploading(true);

      const newBlob = await put(currentFile.name, currentFile, {
        access: "public",
        handleBlobUploadUrl: "/api/file/browser-upload",
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
    numPages?: number
  ) => {
    // create a document in the database with the blob url
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: blob.pathname,
        url: blob.url,
        numPages: numPages,
      }),
    });

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

  const handleCopyToClipboard = (id: string) => {
    navigator.clipboard
      .writeText(`${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`)
      .catch((error) => {
        console.log("Failed to copy text to clipboard", error);
      });

    setCopiedLink(true);

    toast.success("Document uploaded and link copied to clipboard.");
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
            <h1 className="font-display text-3xl font-semibold text-gray-100 transition-colors sm:text-4xl">
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
                  <button
                    type="submit"
                    className="rounded-md bg-gray-100 px-3 py-2 w-full text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:text-gray-100 hover:bg-gray-500 disabled:text-gray-400 disabled:bg-gray-800 disabled:cursor-not-allowed"
                    disabled={uploading || !currentFile}
                  >
                    {uploading ? "Uploading..." : "Upload Document"}
                  </button>
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
            <h1 className="font-display text-3xl font-semibold text-gray-100 transition-colors sm:text-4xl">
              Share your unique link
            </h1>
          </motion.div>

          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            {!currentLinkId && (
              <main className="min-h-[300px]">
                <div className="flex flex-col justify-center">
                  <div className="flex py-8 rounded-md shadow-sm">
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
                    <div className="flex py-8 rounded-md shadow-sm">
                      <div className="flex w-full max-w-xs sm:max-w-lg focus-within:z-10">
                        <p className="block w-full md:min-w-[500px] rounded-none rounded-l-md px-4 text-left border-0 py-1.5 text-gray-200 bg-gray-900 leading-6 overflow-y-scroll">
                          {`${process.env.NEXT_PUBLIC_BASE_URL}/view/${currentLinkId}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold bg-gray-700 ring-1 ring-inset ring-gray-800 hover:ring-gray-400 animate-pulse"
                        title="Copy link"
                        onClick={() => handleCopyToClipboard(currentLinkId)}
                      >
                        <DocumentDuplicateIcon
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center mb-4">
                    <button
                      onClick={() => router.push(`/documents/${currentDocId}`)}
                      type="submit"
                      className="flex items-center rounded-md px-5 py-2 w-fit text-sm font-semibold  shadow-sm transition-colors text-gray-900 bg-gray-100 hover:text-gray-100 hover:bg-gray-500 disabled:hover:text-gray-900 disabled:bg-gray-700 disabled:cursor-not-allowed"
                      disabled={!copiedLink}
                    >
                      {"To analytics"}
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
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
