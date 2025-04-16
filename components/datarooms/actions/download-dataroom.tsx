import { useState } from "react";

import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonTooltip } from "@/components/ui/tooltip";

export default function DownloadDataroomButton({
  teamId,
  dataroomId,
}: {
  teamId: string;
  dataroomId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const downloadDataroom = async () => {
    setIsLoading(true);
    try {
      toast.promise(
        fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/download/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        {
          loading: "Downloading dataroom...",
          success: async (response) => {
            const { downloadUrl } = await response.json();

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
              document.body.removeChild(link);
            }, 100);

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
      setIsLoading(false);
    }
  };
  return (
    <ButtonTooltip content="Download Dataroom" sideOffset={4}>
      <Button
        onClick={downloadDataroom}
        variant="outline"
        className=""
        size="sm"
        loading={isLoading}
      >
        <DownloadIcon />
      </Button>
    </ButtonTooltip>
  );
}
