import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import Skeleton from "../Skeleton";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";
import { useTeam } from "@/context/team-context";
import { Label } from "../ui/label";

export default function NotionForm() {
  const router = useRouter();
  const plausible = usePlausible();
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [notionLink, setNotionLink] = useState<string | null>(null);
  const teamInfo = useTeam();

  const handleNotionUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    // Check if the file is chosen
    if (!notionLink) {
      toast.error("Please enter a Notion link to proceed.");
      return; // prevent form from submitting
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
        const linkId = document.links[0].id;

        // track the event
        plausible("documentUploaded");
        plausible("notionDocumentUploaded");

        // redirect to the document page
        setTimeout(() => {
          setCurrentDocId(document.id);
          setCurrentLinkId(linkId);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error(
        "An error occurred while processing the Notion link: ",
        error,
      );
      setNotionLink(null);
      setUploading(false);
    }
  };

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
      {!currentDocId && (
        <motion.div
          className="z-10 flex flex-col space-y-10 -mt-10"
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
              Share a Notion Page
            </h1>
          </motion.div>
          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            <form
              encType="multipart/form-data"
              onSubmit={handleNotionUpload}
              className="flex flex-col"
            >
              <div className="space-y-1 pb-8">
                <Label htmlFor="notion-link">Add Notion Page Link</Label>
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
          </motion.div>
        </motion.div>
      )}

      {currentDocId && (
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
                  <div className="flex items-center justify-center mb-4">
                    <Button
                      onClick={() => handleContinue(currentLinkId)}
                      type="submit"
                    >
                      {"Share Document"}
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
