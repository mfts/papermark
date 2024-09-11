import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useDeleteGroupModal } from "./delete-group-modal";

export default function DeleteGroup({
  dataroomId,
  groupName,
  groupId,
}: {
  dataroomId: string;
  groupName: string;
  groupId: string;
}) {
  const { setShowDeleteGroupModal, DeleteGroupModal } = useDeleteGroupModal({
    dataroomId,
    groupId,
    groupName,
  });

  return (
    <div className="rounded-lg">
      <DeleteGroupModal />
      <Card className="border-destructive bg-transparent">
        <CardHeader>
          <CardTitle>Delete Group</CardTitle>
          <CardDescription>
            Permanently delete your group. <br />
            <span className="font-medium">This action cannot be undone</span> -
            please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <div className="shrink-0">
            <Button
              onClick={() => setShowDeleteGroupModal(true)}
              variant="destructive"
            >
              Delete Group
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
