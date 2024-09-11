import { useState } from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
          error: (error) => {
            console.log(error);
            return error.message || "An error occurred while copying dataroom.";
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
    <div className="rounded-lg">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Duplicate Dataroom</CardTitle>
          <CardDescription>
            Create a new data room with the same content (folders and files) as
            this data room.
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <div className="shrink-0">
            <Button
              onClick={(e) => handleDuplicateDataroom(e)}
              loading={loading}
            >
              Duplicate Dataroom
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
