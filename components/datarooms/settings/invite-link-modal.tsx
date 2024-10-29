import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { CopyIcon, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import { useAnalytics } from "@/lib/analytics";
import { DialogClose } from "@radix-ui/react-dialog";

export function InviteLinkModal({
  dataroomId,
  groupId,
  open,
  setOpen,
  children,
}: {
  dataroomId: string;
  groupId: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const [isPending, setIsPending] = useState<boolean>(false);
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const analytics = useAnalytics();

  const joinCode = useJoinCode(dataroomId, groupId);


  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${workspaceId}`

    navigator.clipboard.writeText(inviteLink).then(() => toast.success('Link copied to clipboard'))
  }

  const handleNewJoinCode = async () => {
    const ok = await confirm()

    if (!ok) return

    mutate({ workspaceId }, { onSuccess: () => toast.success('Invite code regenerated'), onError: () => toast.error('Failed to regenerate invite code') })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>
            Invite people to {teamInfo?.currentTeam?.name}
          </DialogTitle>
          <DialogDescription>
            Use the code below to invite people to your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-y-4 py-10">
          <p className="text-4xl font-bold uppercase tracking-widest">
            {joinCode}
          </p>

          <Button onClick={handleCopy} variant="ghost" size="sm">
            Copy link <CopyIcon className="ml-2 size-4" />
          </Button>
        </div>

        <div className="flex w-full items-center justify-between">
          <Button
            variant="outline"
            onClick={handleNewJoinCode}
            disabled={isPending}
          >
            {isPending ? (
              <>
                generating
                <Loader2 className="ml-2 size-4 animate-spin" />
              </>
            ) : (
              <>
                New code
                <RefreshCcw className="ml-2 size-4" />
              </>
            )}
          </Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
