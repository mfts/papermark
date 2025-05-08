import { useRouter } from "next/router";

import { useState } from "react";

import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { mutate } from "swr";

import { Team } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddTeamModalProps {
  children: React.ReactNode;
  setCurrentTeam: (team: Team) => void;
}

export function AddTeamModal({ children, setCurrentTeam }: AddTeamModalProps) {
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
        team: teamName.trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setLoading(false);
      toast.error(error);
      return;
    }
    const data = await response.json();
    mutate("/api/teams");
    localStorage.setItem("currentTeamId", data.id);
    setCurrentTeam(data);
    toast.success("Team created successfully!");
    router.push("/documents");
    setLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="bg-background text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Create a Team</DialogTitle>
          <DialogDescription className="mb-1 py-2 text-sm text-muted-foreground">
            Start by naming your new team and inviting team members.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleCreateTeam}
          className="mt-4 flex flex-col gap-8"
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
