import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyInviteLinkButton } from "./copy-invite-link-button";
import { useEffect } from "react";

export function InviteLinkModal({
  open,
  setOpen,
  inviteLink,
  handleResetInviteLink,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inviteLink: string | null;
  handleResetInviteLink: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Invite Link</DialogTitle>
          <DialogDescription>
            Share the invite link with your team members.
          </DialogDescription>
        </DialogHeader>
        
        {/* Invite Link Section */}
        <div className="mb-4">
          <Label className="opacity-80">Invite Link</Label>
          <Input 
            value={inviteLink || ""} 
            readOnly 
            className="mt-1 w-full" 
            onFocus={(e) => e.target.blur()}
          />
          <div className="mt-2 flex space-x-2">
            <CopyInviteLinkButton
              inviteLink={inviteLink}
              className="flex-1"
            />
            <Button
              onClick={handleResetInviteLink}
              disabled={!inviteLink}
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