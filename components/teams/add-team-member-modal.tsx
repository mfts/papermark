import { useState } from "react";
import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { z } from "zod";

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

  const teamId = teamInfo?.currentTeam?.id;
  const analytics = useAnalytics();
  const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { message: "Please enter a valid email." })
    .email({ message: "Please enter a valid email." });


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/teams/${teamId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: validation.data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setLoading(false);
      setOpen(false);
      toast.error(error);
      return;
    }

    analytics.capture("Team Member Invitation Sent", {
      email: validation.data,
      teamId: teamId,
    });

    mutate(`/api/teams/${teamId}/invitations`);

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
