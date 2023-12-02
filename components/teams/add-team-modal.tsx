import { usePlausible } from "next-plausible";
import { useRouter } from "next/router";
import { useState } from "react";
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

export function AddTeamModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const plausible = usePlausible();
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!teamName) return;

    setLoading(true);
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        team: teamName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setLoading(false);
      toast.error(error);
      return;
    }

    toast.success("Team created successfully!");
    router.push("/documents");
    setLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="text-foreground bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Create a Team</DialogTitle>
          <DialogDescription className="py-2 mb-1 text-sm text-muted-foreground">
            Start by naming your new team and inviting team members.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleCreateTeam}
          className="flex flex-col gap-8 mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="team">Team name</Label>
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
              className="w-full lg:w-1/2"
              loading={loading}
              // disabled={uploading || !currentFile}
            >
              {loading ? "Creating..." : "Create"}
              {/* {uploading ? "Uploading..." : "Upload Document"} */}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
