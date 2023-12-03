import { usePlausible } from "next-plausible";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useTeam } from "@/context/team-context";
import { mutate } from "swr";

export function DeleteTeamModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const plausible = usePlausible();
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const teamInfo = useTeam();

  const handleDeleteTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!teamName) return;

    if (teamName.trim() !== teamInfo?.currentTeam?.name) {
      toast.error("Team name doesn't match");
      return;
    }

    if (teamInfo?.teams?.length === 1) {
      toast.error("You cannot delete your only team");
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}`, {
      method: "DELETE",
    });

    if (response.status !== 204) {
      const error = await response.json();
      toast.error(error);
      setLoading(false);
      return;
    }

    await mutate("/api/teams");
    setLoading(false);
    toast.success("Team deleted successfully!");
    router.push("/documents");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="text-foreground bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogDescription className="py-2 mb-1 text-sm text-muted-foreground">
            Warning: This will permanently delete your team, custom domain, and
            all associated documents and their respective stats.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleDeleteTeam}
          className="flex flex-col gap-8 mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="team">
                Enter the team name{" "}
                <strong className="font-extrabold italic">
                  {teamInfo?.currentTeam?.name}
                </strong>{" "}
                to continue:
              </Label>
            </div>
            <div>
              <Input
                id="team"
                placeholder="Enter team's name"
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-center">
            <Button
              type="submit"
              variant={"destructive"}
              className="w-full lg:w-1/2"
              loading={loading}
              // disabled={uploading || !currentFile}
            >
              {loading ? "Deleting..." : "Delete Team"}
              {/* {uploading ? "Uploading..." : "Upload Document"} */}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
