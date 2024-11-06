import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

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

import { useAnalytics } from "@/lib/analytics";

import { CopyInviteLinkButton } from "./copy-invite-link-button";

export function AddTeamMembers({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [joinLink, setJoinLink] = useState<string | null>(null);
  const [joinLinkLoading, setJoinLinkLoading] = useState<boolean>(true);
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  useEffect(() => {
    const fetchJoinLink = async () => {
      setJoinLinkLoading(true);
      try {
        const response = await fetch(
          `/api/teams/${teamInfo?.currentTeam?.id}/join-link`,
        );
        if (response.ok) {
          const data = await response.json();
          setJoinLink(data.joinLink || null);
        } else {
          console.error("Failed to fetch join link:", response.status);
        }
      } catch (error) {
        console.error("Error fetching join link:", error);
      } finally {
        setJoinLinkLoading(false);
      }
    };
    fetchJoinLink();
  }, [teamInfo]);

  const handleResetJoinLink = async () => {
    setJoinLinkLoading(true);
    try {
      const linkResponse = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/join-link`,
        {
          method: "POST",
        },
      );

      if (!linkResponse.ok) {
        throw new Error("Failed to reset join link");
      }

      const linkData = await linkResponse.json();
      setJoinLink(linkData.joinLink || null);
      toast.success("Join link has been reset!");
    } catch (error) {
      toast.error("Error resetting join link.");
    } finally {
      setJoinLinkLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error);
      }

      toast.success("A join email has been sent!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Invite team members via email or share the join link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="email" className="opacity-80">
            Email
          </Label>
          <Input
            id="email"
            placeholder="team@member.com"
            className="mb-4 mt-1 w-full"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="mb-6 w-full" disabled={loading}>
            {loading ? "Sending invitation..." : "Send Invitation"}
          </Button>
        </form>

        <div className="mb-4">
          <Label className="opacity-80">Or share join link</Label>
          <Input value={joinLink || ""} readOnly className="mt-1 w-full" />
          <div className="mt-2 flex space-x-2">
            <CopyInviteLinkButton
              inviteLink={joinLink}
              className="flex-1"
            />
            <Button
              onClick={handleResetJoinLink}
              disabled={joinLinkLoading}
              className="flex-1"
            >
              Reset Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
