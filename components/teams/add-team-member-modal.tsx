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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkLoading, setInviteLinkLoading] = useState<boolean>(true);
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  useEffect(() => {
    const fetchInviteLink = async () => {
      setInviteLinkLoading(true);
      try {
        const response = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/invite-link`);
        if (response.ok) {
          const data = await response.json();
          setInviteLink(data.inviteLink || null);
        } else {
          console.error("Failed to fetch invite link:", response.status);
        }
      } catch (error) {
        console.error("Error fetching invite link:", error);
      } finally {
        setInviteLinkLoading(false);
      }
    };
    fetchInviteLink();
  }, [teamInfo]);

  const handleResetInviteLink = async () => {
    setInviteLinkLoading(true);
    try {
      const linkResponse = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/invite-link`, {
        method: "POST",
      });

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
      const response = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

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

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Invite team members via email or share the invite link.
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
          <Label className="opacity-80">Or share invite link</Label>
          <Input
            value={inviteLink || ""}
            readOnly
            className="mt-1 w-full"
          />
          <div className="mt-2 flex justify-between">
            <Button 
              onClick={handleCopyInviteLink} 
              disabled={!inviteLink || inviteLinkLoading}
              className="flex-1 mr-2"
            >
              Copy Link
            </Button>
            <Button 
              onClick={handleResetInviteLink} 
              disabled={inviteLinkLoading}
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
