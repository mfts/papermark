import { useState } from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ArchiveDataroom({
  dataroomId,
  teamId,
}: {
  dataroomId: string;
  teamId?: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleArchiveDataroom = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!teamId) {
      return;
    }

    setLoading(true);

    try {
      toast.promise(
        fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/archive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message ||
                "An error occurred while archiving dataroom.",
            );
          }
          return response.json();
        }),
        {
          loading: "Archiving dataroom...",
          success: () => {
            mutate(`/api/teams/${teamId}/datarooms`);
            return "Dataroom archived successfully!";
          },
          error: "Failed to archive dataroom.",
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Archive Dataroom</CardTitle>
          <CardDescription>
            Archive this dataroom and disable all its links. This action can be
            undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <Button
            variant="destructive"
            onClick={handleArchiveDataroom}
            disabled={loading}
          >
            {loading ? "Archiving..." : "Archive Dataroom"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
