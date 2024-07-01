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
    <div className="rounded-lg bg-background">
      <Card>
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
    // <div className="rounded-lg border border-gray-200 bg-white">
    //   <div className="flex flex-col space-y-3 p-5 sm:p-10">
    //     <h2 className="text-xl font-medium">Duplicate Dataroom</h2>
    //     <p className="text-sm text-gray-500">
    //       Create a new data room with the same content (folders and files) as
    //       this data room.
    //     </p>
    //   </div>
    //   <div className="border-b border-gray-200" />

    //   <div className="flex items-center justify-end px-5 py-4 sm:px-10">
    //     <Button onClick={(e) => handleDuplicateDataroom(e)} loading={loading}>
    //       Duplicate Dataroom
    //     </Button>
    //   </div>
    // </div>
  );
}
