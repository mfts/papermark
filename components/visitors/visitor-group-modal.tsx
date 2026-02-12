import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { sanitizeList } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { VisitorGroupWithCount } from "@/lib/swr/use-visitor-groups";

export function VisitorGroupModal({
  open,
  setOpen,
  existingGroup,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  existingGroup?: VisitorGroupWithCount | null;
}) {
  const [groupName, setGroupName] = useState<string>("");
  const [emailsInput, setEmailsInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();

  useEffect(() => {
    if (existingGroup) {
      setGroupName(existingGroup.name);
      setEmailsInput(existingGroup.emails.join("\n"));
    } else {
      setGroupName("");
      setEmailsInput("");
    }
  }, [existingGroup, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!groupName || groupName.trim().length < 2) {
      toast.error("Please provide a group name with at least 2 characters.");
      return;
    }

    setLoading(true);

    const emails = sanitizeList(emailsInput);

    try {
      const url = existingGroup
        ? `/api/teams/${teamInfo?.currentTeam?.id}/visitor-groups/${existingGroup.id}`
        : `/api/teams/${teamInfo?.currentTeam?.id}/visitor-groups`;

      const response = await fetch(url, {
        method: existingGroup ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim(), emails }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to save visitor group.");
        setLoading(false);
        return;
      }

      toast.success(
        existingGroup
          ? "Visitor group updated successfully!"
          : "Visitor group created successfully!",
      );

      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/visitor-groups`,
      );
    } catch (error) {
      toast.error("Error saving visitor group. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-start">
          <DialogTitle>
            {existingGroup ? "Edit Visitor Group" : "Create Visitor Group"}
          </DialogTitle>
          <DialogDescription>
            {existingGroup
              ? "Update the group name and email list. Changes will apply to all links using this group."
              : "Create a named group of emails and domains. You can then apply this group to document and data room links."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name" className="opacity-80">
                Group Name
              </Label>
              <Input
                id="group-name"
                placeholder="e.g., Series A Investors"
                className="mt-1 w-full"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="group-emails" className="opacity-80">
                Emails & Domains
              </Label>
              <Textarea
                id="group-emails"
                className="mt-1 w-full focus:ring-inset"
                rows={6}
                placeholder={`Enter emails or domains, one per line, e.g.
investor@fund.com
partner@vc.com
@example.org`}
                value={emailsInput}
                onChange={(e) => setEmailsInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use @domain.com to allow all emails from a domain.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" loading={loading} className="h-9 w-full">
              {existingGroup ? "Update Group" : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
