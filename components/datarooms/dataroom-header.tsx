import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import LinkSheet from "@/components/links/link-sheet";
import { Button } from "@/components/ui/button";

import { useDataroomLinks } from "@/lib/swr/use-dataroom";

import { ButtonTooltip } from "../ui/tooltip";

export const DataroomHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode[];
}) => {
  const router = useRouter();
  const dataroomId = router.query.id as string;
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const { links } = useDataroomLinks();
  const [loading, setLoading] = useState<boolean>(false);
  const teamInfo = useTeam();

  const actionRows: React.ReactNode[][] = [];
  if (actions) {
    for (let i = 0; i < actions.length; i += 3) {
      actionRows.push(actions.slice(i, i + 3));
    }
  }

  const downloadDataroom = async () => {
    setLoading(true);
    try {
      toast.promise(
        fetch(
          `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/download/bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
        {
          loading: "Downloading dataroom...",
          success: async (response) => {
            const { downloadUrl } = await response.json();
            window.open(downloadUrl, "_blank");
            return "Dataroom downloaded successfully.";
          },
          error: (error) => {
            console.log(error);
            return (
              error.message || "An error occurred while downloading dataroom."
            );
          },
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex min-h-10 items-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-x-1">
          <ButtonTooltip content="Download Dataroom" sideOffset={4}>
            <Button
              onClick={downloadDataroom}
              className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
              size="icon"
              loading={loading}
            >
              <DownloadIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
            Share
          </Button>
        </div>
        <LinkSheet
          linkType={"DATAROOM_LINK"}
          isOpen={isLinkSheetOpen}
          setIsOpen={setIsLinkSheetOpen}
          existingLinks={links}
        />
      </div>
    </section>
  );
};
