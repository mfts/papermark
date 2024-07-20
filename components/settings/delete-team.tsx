import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useDeleteTeamModal } from "./delete-team-modal";

export default function DeleteTeam() {
  const { setShowDeleteTeamModal, DeleteTeamModal } = useDeleteTeamModal();

  return (
    <div className="rounded-lg">
      <DeleteTeamModal />
      <Card className="border-destructive bg-transparent">
        <CardHeader>
          <CardTitle>Delete Team</CardTitle>
          <CardDescription>
            Permanently delete your team, custom domains, and all associated
            documents, links + their views. <br />
            <span className="font-medium">This action cannot be undone</span> -
            please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <div className="shrink-0">
            <Button
              onClick={() => setShowDeleteTeamModal(true)}
              variant="destructive"
            >
              Delete Team
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
