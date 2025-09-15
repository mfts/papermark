import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkType } from "@prisma/client";
import Cookies from "js-cookie";
import { motion } from "motion/react";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { DocumentData, createDocument } from "@/lib/documents/create-document";
import { putFile } from "@/lib/files/put-file";
import {
  convertDataUrlToFile,
  copyToClipboard,
  uploadImage,
} from "@/lib/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";

import DocumentUpload from "@/components/document-upload";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import Skeleton from "../Skeleton";
import { DEFAULT_LINK_PROPS, DEFAULT_LINK_TYPE } from "../links/link-sheet";
import { LinkOptions } from "../links/link-sheet/link-options";

export default function DeckGeneratorUpload() {
  const router = useRouter();
  const { groupId } = router.query as {
    id: string;
    groupId?: string;
  };
  const plausible = usePlausible();
  const analytics = useAnalytics();
  const [uploading, setUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(LinkType.DOCUMENT_LINK, groupId),
  );
  const teamInfo = useTeam();

  const teamId = teamInfo?.currentTeam?.id as string;

  // When the user enters this page, it will fetch the reportUrl from the cookies with js-cookie, then it will use putFile to upload the file to the server

  useEffect(() => {
    const reportUrl = Cookies.get("savedReport");
    if (reportUrl) {
      const blob = fetch(reportUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const file = new File([blob], "Pitchdeck.pdf", {
            type: "application/pdf",
          });
          setCurrentFile(file);
        })
        .catch((error) => console.error("Error fetching report:", error));

      // Cookies.remove("reportUrl");
    }
  }, []);

  const handleBrowserUpload = async (event: any) => {
    event.preventDefault();

    // Check if the file is chosen
    if (!currentFile) {
      toast.error("Please select a file to upload.");
      return; // prevent form from submitting
    }

    try {
      setUploading(true);

      const contentType = currentFile.type;
      const supportedFileType = getSupportedContentType(contentType);

      if (!supportedFileType) {
        setUploading(false);
        toast.error(
          "Unsupported file format. Please upload a PDF or Excel file.",
        );
        return;
      }

      const { type, data, numPages, fileSize } = await putFile({
        file: currentFile,
        teamId,
      });

      setCurrentFile(null);
      setCurrentBlob(true);

      const documentData: DocumentData = {
        name: currentFile.name,
        key: data!,
        storageType: type!,
        contentType: contentType,
        supportedFileType: supportedFileType,
        fileSize: fileSize,
      };
      // create a document in the database
      const response = await createDocument({
        documentData,
        teamId,
        numPages,
        createLink: true,
      });

      if (response) {
        const document = await response.json();
        const linkId = document.links[0].id;

        // track the event
        plausible("documentUploaded");
        analytics.capture("Document Added", {
          documentId: document.id,
          name: document.name,
          numPages: document.numPages,
          path: router.asPath,
          type: document.type,
          teamId: teamInfo?.currentTeam?.id,
        });
        analytics.capture("Link Added", {
          linkId: document.links[0].id,
          documentId: document.id,
          customDomain: null,
          teamId: teamInfo?.currentTeam?.id,
        });

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
        targetId: currentDocId,
        linkType: LinkType.DOCUMENT_LINK,
        teamId: teamId,
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
      `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${currentLinkId}`,
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
              {`Upload your ${router.query.type ? router.query.type : "document"}`}
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
                  className="px-0 text-xs font-normal text-muted-foreground underline hover:text-gray-700"
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
              <main className="max-h-[calc(100dvh-10rem)] min-h-[300px] overflow-y-scroll scrollbar-hide">
                <div className="flex flex-col justify-center">
                  <div className="relative">
                    <div className="flex py-8">
                      <div className="flex w-full max-w-xs focus-within:z-10 sm:max-w-lg">
                        <p className="block w-full overflow-y-scroll rounded-md border-0 bg-secondary px-4 py-1.5 text-left leading-6 text-secondary-foreground md:min-w-[500px]">
                          {`${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${currentLinkId}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-xs pb-8 sm:max-w-lg">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="space-x-2 rounded-lg py-0">
                          <span className="text-sm font-medium leading-6 text-foreground">
                            Configure Link Options
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="first:pt-5">
                          <LinkOptions
                            data={linkData}
                            setData={setLinkData}
                            linkType={LinkType.DOCUMENT_LINK}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <div className="mb-4 flex items-center justify-center">
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
