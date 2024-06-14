import { useState } from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";

export default function DuplicateDataroom({
  dataroomId,
  teamId,
}: {
  dataroomId: string;
  teamId?: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleDuplicateDataroom = async (
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
        fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/duplicate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        {
          loading: "Copying dataroom...",
          success: () => {
            mutate(`/api/teams/${teamId}/datarooms`);
            return "Dataroom copied successfully.";
          },
          error: "Failed to copy dataroom.",
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-col space-y-3 p-5 sm:p-10">
        <h2 className="text-xl font-medium">Duplicate Dataroom</h2>
        <p className="text-sm text-gray-500">
          Create a new data room with the same content (folders and files) as
          this data room.
        </p>
      </div>
      <div className="border-b border-gray-200" />

      <div className="flex items-center justify-end px-5 py-4 sm:px-10">
        <div>
          <Button onClick={(e) => handleDuplicateDataroom(e)} loading={loading}>
            Duplicate Dataroom
          </Button>
        </div>
      </div>
    </div>
  );
}
