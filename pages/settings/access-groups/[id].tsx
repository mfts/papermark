import { useRouter } from "next/router";

import { FormEvent, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeft, InfoIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAccessGroup } from "@/lib/swr/use-access-groups";
import { sanitizeAllowDenyList } from "@/lib/utils";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function EditAccessGroup() {
  const router = useRouter();
  const { id } = router.query;
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const {
    accessGroup,
    loading: isLoadingGroup,
    mutate,
  } = useAccessGroup(id as string);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState("");
  const [emailListInput, setEmailListInput] = useState("");
  const [duplicatesFound, setDuplicatesFound] = useState<string[]>([]);

  const isAllowType = accessGroup?.type === "ALLOW";

  // Update form when group data loads
  useEffect(() => {
    if (accessGroup) {
      setName(accessGroup.name);
      setEmailListInput(accessGroup.emailList.join("\n"));
    }
  }, [accessGroup]);

  // Function to detect duplicates in the email list
  const detectDuplicates = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domainRegex = /^@[^\s@]+\.[^\s@]+$/;

    const items = input
      .split("\n")
      .map((item) => item.trim().replace(/,$/, "").toLowerCase())
      .filter((item) => item !== "")
      .filter((item) => emailRegex.test(item) || domainRegex.test(item));

    const seen = new Set<string>();
    const duplicates = new Set<string>();

    items.forEach((item) => {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    });

    return Array.from(duplicates);
  };

  // Handle email list input changes and detect duplicates
  const handleEmailListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEmailListInput(value);

    // Detect duplicates
    const foundDuplicates = detectDuplicates(value);
    setDuplicatesFound(foundDuplicates);
  };

  const getDisplayText = () => {
    return {
      title: isAllowType ? "Edit Allow List Group" : "Edit Block List Group",
      fieldLabel: isAllowType
        ? "Allowed Emails/Domains"
        : "Blocked Emails/Domains",
      placeholder: isAllowType
        ? `Enter allowed emails/domains, one per line, e.g.
john@company.com
jane@company.com
@partner.org
@external.com`
        : `Enter blocked emails/domains, one per line, e.g.
spam@blocked.com
unwanted@domain.com
@competitor.com`,
      helpText: isAllowType
        ? "Enter one email address or domain per line. Use @domain.com format to allow entire domains."
        : "Enter one email address or domain per line. Use @domain.com format to block entire domains.",
      successMessage: isAllowType
        ? "Allow list group updated successfully"
        : "Block list group updated successfully",
      deleteSuccessMessage: isAllowType
        ? "Allow list group deleted successfully"
        : "Block list group deleted successfully",
      errorMessage: isAllowType
        ? "Failed to update allow list group"
        : "Failed to update block list group",
      deleteErrorMessage: isAllowType
        ? "Failed to delete allow list group"
        : "Failed to delete block list group",
      groupTypeName: isAllowType ? "allow" : "block",
    };
  };

  const displayText = getDisplayText();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a name for the group");
      return;
    }

    if (!emailListInput.trim()) {
      toast.error("Please add at least one email or domain");
      return;
    }

    setIsLoading(true);

    try {
      const emailList = sanitizeAllowDenyList(emailListInput);

      if (emailList.length === 0) {
        toast.error("Please provide valid email addresses or domains");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/access-groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          emailList,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || displayText.errorMessage);
      }

      toast.success(displayText.successMessage);
      mutate(); // Refresh the data
    } catch (error: any) {
      toast.error(error.message || displayText.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!teamId || !id) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/access-groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || displayText.deleteErrorMessage);
      }

      toast.success(displayText.deleteSuccessMessage);
      router.push("/settings/access-control");
    } catch (error: any) {
      toast.error(error.message || displayText.deleteErrorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get the current link count for this group
  const getLinkCount = () => {
    if (!accessGroup?._count) return 0;
    return accessGroup.type === "ALLOW"
      ? accessGroup._count.allowLinks
      : accessGroup._count.blockLinks;
  };

  const linkCount = getLinkCount();

  if (isLoadingGroup) {
    return (
      <AppLayout>
        <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
          <SettingsHeader />
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold tracking-tight">
              Loading...
            </h2>
          </div>
        </main>
      </AppLayout>
    );
  }

  if (!accessGroup) {
    return (
      <AppLayout>
        <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
          <SettingsHeader />
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Group not found</h2>
            <p className="text-muted-foreground">
              The access group you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button
              onClick={() => router.push("/settings/access-control")}
              className="mt-4"
            >
              Back to Access Control
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-semibold tracking-tight">
                {displayText.title}
              </h2>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Group"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the {displayText.groupTypeName} list group &quot;
                    {accessGroup.name}&quot;.
                    {linkCount > 0 && (
                      <span className="mt-2 block font-medium text-orange-600">
                        Note: This group is currently being used by {linkCount}{" "}
                        link(s). Deleting it will automatically remove the group
                        from all these links.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Group Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Board Members, External Partners"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for your {displayText.groupTypeName} list
                  group (max 50 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailList">
                  {displayText.fieldLabel}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="emailList"
                  rows={8}
                  placeholder={displayText.placeholder}
                  value={emailListInput}
                  onChange={handleEmailListChange}
                  className="font-mono text-sm"
                  required
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {displayText.helpText}
                  </p>
                  {duplicatesFound.length > 0 && (
                    <Alert variant="default">
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Duplicates detected:</strong> The following
                        entries appear multiple times and will be automatically
                        removed when saved:{" "}
                        <span className="font-mono text-sm">
                          {duplicatesFound.join(", ")}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {linkCount > 0 && (
                <Alert variant="default">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> This group is currently being used by{" "}
                    {linkCount} link(s). Changes will automatically apply to all
                    links using this group.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
