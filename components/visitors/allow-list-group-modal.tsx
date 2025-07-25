import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import {
  type AllowListGroup,
  createAllowListGroup,
  updateAllowListGroup,
} from "@/lib/swr/use-allow-list-groups";
import { sanitizeList } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AllowListGroupModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  group?: AllowListGroup | null;
  onSuccess?: () => void;
}

export default function AllowListGroupModal({
  isOpen,
  setIsOpen,
  group,
  onSuccess,
}: AllowListGroupModalProps) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [name, setName] = useState("");
  const [emailListInput, setEmailListInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when group changes
  useEffect(() => {
    if (group) {
      setName(group.name);
      setEmailListInput(group.allowList.join("\n"));
    } else {
      setName("");
      setEmailListInput("");
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId) {
      toast.error("Team not found");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const allowList = sanitizeList(emailListInput);
    if (allowList.length === 0) {
      toast.error("Please enter at least one email or domain");
      return;
    }

    setIsLoading(true);

    try {
      if (group) {
        // Update existing group
        await updateAllowListGroup(teamId, group.id, {
          name: name.trim(),
          allowList,
        });
        toast.success("Allow list group updated successfully");
      } else {
        // Create new group
        await createAllowListGroup(teamId, {
          name: name.trim(),
          allowList,
        });
        toast.success("Allow list group created successfully");
      }

      // Refresh the allow list groups
      mutate(`/api/teams/${teamId}/allow-list-groups`);

      // Close modal and reset form
      setIsOpen(false);
      setName("");
      setEmailListInput("");

      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      setName("");
      setEmailListInput("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {group ? "Edit Allow List Group" : "Create Allow List Group"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Update the group name and email/domain list."
              : "Create a reusable group that can be applied to links."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Client Team, Partners"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailList">Allowed Emails & Domains</Label>
            <Textarea
              id="emailList"
              rows={6}
              placeholder={`Enter allowed emails/domains, one per line, e.g.
marc@papermark.io
@example.org
jane.doe@company.com`}
              value={emailListInput}
              onChange={(e) => setEmailListInput(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-sm text-muted-foreground">
              Use @ prefix for domains (e.g., @company.com) or specific email
              addresses
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : group
                  ? "Update Group"
                  : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
