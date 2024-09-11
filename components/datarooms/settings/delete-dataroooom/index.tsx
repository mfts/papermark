import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useDeleteDataroomModal } from "./delete-dataroom-modal";

export default function DeleteDataroom({
  dataroomId,
  dataroomName,
}: {
  dataroomId: string;
  dataroomName: string;
}) {
  const { setShowDeleteDataroomModal, DeleteDataroomModal } =
    useDeleteDataroomModal({ dataroomId, dataroomName });

  return (
    <div className="rounded-lg">
      <DeleteDataroomModal />
      <Card className="border-destructive bg-transparent">
        <CardHeader>
          <CardTitle>Delete Dataroom</CardTitle>
          <CardDescription>
            Permanently delete your dataroom all associated links and their
            views. <br />
            <span className="font-medium">This action cannot be undone</span> -
            please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <div className="shrink-0">
            <Button
              onClick={() => setShowDeleteDataroomModal(true)}
              variant="destructive"
            >
              Delete Dataroom
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
