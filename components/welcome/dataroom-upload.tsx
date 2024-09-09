import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkType } from "@prisma/client";
import { motion } from "framer-motion";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";

import DocumentUpload from "@/components/document-upload";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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

import Skeleton from "../Skeleton";
import { DEFAULT_LINK_PROPS, DEFAULT_LINK_TYPE } from "../links/link-sheet";
import { LinkOptions } from "../links/link-sheet/link-options";

interface DataroomUploadProps {
  dataroomId: string; // Define the dataroomId prop
}

export default function DataroomUpload({ dataroomId }: DataroomUploadProps) {
  const router = useRouter();
  const plausible = usePlausible();
  const analytics = useAnalytics();
  const [uploading, setUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBlob, setCurrentBlob] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(LinkType.DATAROOM_LINK),
  );
  const teamInfo = useTeam();

  const teamId = teamInfo?.currentTeam?.id as string;

  useEffect(() => {
    if (dataroomId && !currentLinkId) {
      fetchOrCreateDataroomLink();
    }
  }, [dataroomId, currentLinkId]);

  const fetchOrCreateDataroomLink = async () => {
    try {
      const linkResponse = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/links`,
      );
      if (linkResponse.ok) {
        const links = await linkResponse.json();
        if (links.length > 0) {
          setCurrentLinkId(links[0].id);
        } else {
          const createLinkResponse = await fetch(
            `/api/teams/${teamId}/datarooms/${dataroomId}/links`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ linkType: "DATAROOM_LINK" }),
            },
          );
          if (createLinkResponse.ok) {
            const newLink = await createLinkResponse.json();
            setCurrentLinkId(newLink.id);
          } else {
            const errorData = await createLinkResponse.json();
            toast.error(errorData.message || "Failed to create link.");
          }
        }
      } else {
        const errorData = await linkResponse.json();
        toast.error(errorData.message || "Failed to fetch links.");
      }
    } catch (error) {
      console.error("Error fetching or creating dataroom link:", error);
      toast.error("Failed to generate dataroom link. Please try again.");
    }
  };

  const handleFileUpload = async (event: any) => {
    event.preventDefault();

    if (!currentFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);

      const contentType = getSupportedContentType(currentFile.type);

      if (!contentType) {
        setUploading(false);
        toast.error(
          "Unsupported file format. Please upload a PDF or Excel file.",
        );
        return;
      }

      const { type, data, numPages } = await putFile({
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
      };

      const response = await createDocument({ documentData, teamId, numPages });

      if (response) {
        const document = await response.json();

        // Add document to dataroom
        await fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentId: document.id }),
        });

        plausible("documentUploadedToDataroom");
        analytics.capture("Document Added to Dataroom", {
          documentId: document.id,
          name: document.name,
          numPages: document.numPages,
          path: router.asPath,
          type: document.type,
          teamId: teamInfo?.currentTeam?.id,
          dataroomId: dataroomId,
        });

        setTimeout(() => {
          setCurrentDocId(document.id);
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

    let blobUrl: string | null =
      linkData.metaImage && linkData.metaImage.startsWith("data:")
        ? null
        : linkData.metaImage;
    if (linkData.metaImage && linkData.metaImage.startsWith("data:")) {
      const blob = convertDataUrlToFile({ dataUrl: linkData.metaImage });
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
        targetId: dataroomId,
        linkType: "DATAROOM_LINK",
      }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      toast.error(error);
      setIsLoading(false);
      return;
    }

    copyToClipboard(
      `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${currentLinkId}`,
      "Link copied to clipboard. Redirecting to dataroom page...",
    );

    router.push(`/datarooms/${dataroomId}`);
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
            <h1 className="font-display max-w-lg text-3xl font-semibold text-foreground transition-colors sm:text-4xl">
              Upload first document to your data room
            </h1>
          </motion.div>
          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            <main className="mt-8">
              <form
                encType="multipart/form-data"
                onSubmit={handleFileUpload}
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
              Share your dataroom link
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
            {currentLinkId && (
              <main className="min-h-[300px]">
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
                        <AccordionContent className="text-left first:pt-5">
                          <LinkOptions
                            data={linkData}
                            setData={setLinkData}
                            linkType={LinkType.DATAROOM_LINK}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <div className="mb-4 flex items-center justify-center">
                    <Button onClick={handleSubmit} loading={isLoading}>
                      Share Dataroom
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span> One link to share multiple files</span>
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
