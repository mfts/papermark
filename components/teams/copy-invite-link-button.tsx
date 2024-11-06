import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyInviteLinkButtonProps {
  inviteLink: string | null;
  className?: string;
}

export function CopyInviteLinkButton({ inviteLink, className }: CopyInviteLinkButtonProps) {
  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    }
  };

  return (
    <Button onClick={handleCopyInviteLink} disabled={!inviteLink} className={className}>
      Copy Link
    </Button>
  );
}
