import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from 'swr'; 

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
import { InviteLinkModal } from "./invite-link-modal";

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
  const [inviteLinkLoading, setInviteLinkLoading] = useState<boolean>(true);
  const teamInfo = useTeam();

  const [inviteLinkModalOpen, setInviteLinkModalOpen] = useState<boolean>(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

  const { data, error } = useSWR(
    teamInfo?.currentTeam?.id ? `/api/teams/${teamInfo.currentTeam.id}/invite-link` : null,
    fetcher
  );

  useEffect(() => {
    if (data) {
      setInviteLink(data.inviteLink || null);
    }
  }, [data]);

  useEffect(() => {
    setInviteLinkLoading(!inviteLink && !error);
  }, [inviteLink, error]);

  const handleResetInviteLink = async () => {
    setInviteLinkLoading(true);
    try {
      const linkResponse = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/invite-link`,
        {
          method: "POST",
        },
      );

      if (!linkResponse.ok) {
        throw new Error("Failed to reset invite link");
      }
      const linkData = await linkResponse.json();
      setInviteLink(linkData.inviteLink || null);
      toast.success("Invite link has been reset!");
    } catch (error) {
      toast.error("Error resetting invite link.");
    } finally {
      setInviteLinkLoading(false);
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

      toast.success("An invitation email has been sent!");
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
            Invite team members via email.
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending invitation..." : "Send Invitation"}
          </Button>
        </form>

        <Button onClick={() => setInviteLinkModalOpen(true)} className="w-full">
          Invite Link
        </Button>
      </DialogContent>
      <InviteLinkModal 
        open={inviteLinkModalOpen} 
        setOpen={setInviteLinkModalOpen} 
        inviteLink={inviteLink} 
        handleResetInviteLink={handleResetInviteLink} 
      />
    </Dialog>
  );  
}
