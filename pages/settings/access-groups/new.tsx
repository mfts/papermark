import { useRouter } from "next/router";

import { FormEvent, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowLeft, InfoIcon } from "lucide-react";
import { toast } from "sonner";

import { sanitizeAllowDenyList } from "@/lib/utils";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GroupType = "ALLOW" | "BLOCK";

export default function NewAccessGroup() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const groupType = (router.query.type as GroupType) || "ALLOW";
  const isAllowType = groupType === "ALLOW";

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [emailListInput, setEmailListInput] = useState("");
  const [duplicatesFound, setDuplicatesFound] = useState<string[]>([]);

  const getDisplayText = () => {
    return {
      title: isAllowType
        ? "Create Allow List Group"
        : "Create Block List Group",
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
      buttonText: isAllowType ? "Create Allow Group" : "Create Block Group",
      successMessage: isAllowType
        ? "Allow list group created successfully"
        : "Block list group created successfully",
      errorMessage: isAllowType
        ? "Failed to create allow list group"
        : "Failed to create block list group",
    };
  };

  const displayText = getDisplayText();

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

      const response = await fetch(`/api/teams/${teamId}/access-groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          emailList,
          type: groupType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || displayText.errorMessage);
      }

      toast.success(displayText.successMessage);
      router.push("/settings/access-control");
    } catch (error: any) {
      toast.error(error.message || displayText.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="space-y-6">
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
                  A descriptive name for your {isAllowType ? "allow" : "block"}{" "}
                  list group (max 50 characters)
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
                {isLoading ? "Creating..." : displayText.buttonText}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
