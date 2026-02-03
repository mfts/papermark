import { useEffect, useState } from "react";

import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
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
import { SingleSelect } from "@/components/ui/single-select";
import { Textarea } from "@/components/ui/textarea";

interface WorkflowStep {
  id: string;
  name: string;
  stepOrder: number;
  conditions: {
    logic: "AND" | "OR";
    items: Array<{
      type: "email" | "domain";
      operator: string;
      value: string | string[];
    }>;
  };
  actions: Array<{
    type: "route";
    targetLinkId: string;
  }>;
}

interface Link {
  id: string;
  name: string | null;
  slug: string | null;
  domainSlug: string | null;
  linkType: "DOCUMENT_LINK" | "DATAROOM_LINK";
  documentId: string | null;
  dataroomId: string | null;
  allowList: string[]; // Pre-populate from link
  resourceName: string | null; // Document or Dataroom name
  displayName: string; // Human-readable label
}

interface StepFormDialogProps {
  workflowId: string;
  teamId: string;
  step: WorkflowStep | null;
  links: Link[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StepFormDialog({
  workflowId,
  teamId,
  step,
  links,
  open,
  onClose,
  onSuccess,
}: StepFormDialogProps) {
  const [name, setName] = useState(step?.name || "");
  const [targetLinkId, setTargetLinkId] = useState(
    step?.actions[0]?.targetLinkId || "",
  );
  const [allowListInput, setAllowListInput] = useState(() => {
    // Pre-populate from existing step when editing
    if (step && step.conditions.items.length > 0) {
      const allValues: string[] = [];
      step.conditions.items.forEach((condition) => {
        const values = Array.isArray(condition.value)
          ? condition.value
          : [condition.value];
        if (condition.type === "domain") {
          // Prefix domains with @
          allValues.push(...values.map((v) => `@${v}`));
        } else {
          // Email addresses as-is
          allValues.push(...values);
        }
      });
      return allValues.join("\n");
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-populate state when step or open changes to prevent stale values
  useEffect(() => {
    if (open) {
      // Reset name
      setName(step?.name || "");

      // Reset targetLinkId
      setTargetLinkId(step?.actions?.[0]?.targetLinkId || "");

      // Reset allowListInput
      if (step && step.conditions?.items && step.conditions.items.length > 0) {
        const allValues: string[] = [];
        step.conditions.items.forEach((condition) => {
          const values = Array.isArray(condition.value)
            ? condition.value
            : [condition.value];
          if (condition.type === "domain") {
            // Prefix domains with @
            allValues.push(...values.map((v) => `@${v}`));
          } else {
            // Email addresses as-is
            allValues.push(...values);
          }
        });
        setAllowListInput(allValues.join("\n"));
      } else {
        setAllowListInput("");
      }
    }
  }, [step, open]);

  // When link is selected, pre-fill allowList
  const handleLinkChange = (linkId: string) => {
    setTargetLinkId(linkId);
    const selectedLink = links.find((l) => l.id === linkId);
    if (selectedLink && selectedLink.allowList.length > 0) {
      setAllowListInput(selectedLink.allowList.join("\n"));
      // Auto-fill step name if empty
      if (!name && selectedLink.resourceName) {
        setName(`Route to ${selectedLink.resourceName}`);
      }
    } else {
      setAllowListInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Step name is required");
      return;
    }

    if (!targetLinkId) {
      toast.error("Target link is required");
      return;
    }

    if (!allowListInput.trim()) {
      toast.error("At least one email or domain is required");
      return;
    }

    // Validate IDs to prevent SSRF
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    const teamIdValidation = z.string().cuid().safeParse(teamId);
    if (!workflowIdValidation.success || !teamIdValidation.success) {
      toast.error("Invalid workflow or team ID");
      return;
    }

    if (step) {
      const stepIdValidation = z.string().cuid().safeParse(step.id);
      if (!stepIdValidation.success) {
        toast.error("Invalid step ID");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Parse allowList input - separate emails and domains
      const lines = allowListInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const emails: string[] = [];
      const domains: string[] = [];

      lines.forEach((line) => {
        if (line.startsWith("@")) {
          // Domain (remove @ prefix)
          domains.push(line.substring(1));
        } else {
          // Email address
          emails.push(line);
        }
      });

      // Build conditions array
      const conditionItems = [];
      if (emails.length > 0) {
        conditionItems.push({
          type: "email",
          operator: "in_list",
          value: emails,
        });
      }
      if (domains.length > 0) {
        conditionItems.push({
          type: "domain",
          operator: "in_list",
          value: domains,
        });
      }

      const payload = {
        name: name.trim(),
        conditions: {
          logic: "OR", // Match ANY email or domain
          items: conditionItems,
        },
        actions: [
          {
            type: "route",
            targetLinkId,
          },
        ],
      };

      const url = step
        ? `/api/workflows/${workflowId}/steps/${step.id}?teamId=${teamId}`
        : `/api/workflows/${workflowId}/steps?teamId=${teamId}`;

      const response = await fetch(url, {
        method: step ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save step");
      }

      toast.success(step ? "Step updated" : "Step created");
      onSuccess();
    } catch (error) {
      console.error("Error saving step:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save step",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{step ? "Edit Step" : "Add Step"}</DialogTitle>
          <DialogDescription>
            Configure the routing condition and target link
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name *</Label>
            <Input
              id="step-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Route Company A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-link">Route to Link *</Label>
            <SingleSelect
              options={links.map((link) => ({
                value: link.id,
                label: link.displayName,
                searchableText: `${link.displayName} ${link.resourceName || ""} ${link.slug || ""} ${link.domainSlug || ""} ${link.id}`,
                meta: link,
              }))}
              value={targetLinkId}
              onValueChange={handleLinkChange}
              placeholder="Select a link..."
              searchPlaceholder="Search links by name, slug, domain, or ID..."
              emptyText="No links found."
              className="w-full"
              renderOption={(option, isSelected) => {
                const link = option.meta as Link;
                if (!link) return null;

                return (
                  <div className="flex w-full flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{link.displayName}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          isSelected && "bg-primary/10 text-primary",
                        )}
                      >
                        {link.linkType === "DOCUMENT_LINK"
                          ? "Document"
                          : "Dataroom"}
                      </Badge>
                    </div>
                    {link.resourceName && (
                      <span className="text-xs text-muted-foreground">
                        {link.resourceName}
                      </span>
                    )}
                    {link.domainSlug && link.slug && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {link.domainSlug}/{link.slug}
                      </span>
                    )}
                    {!link.domainSlug && link.slug && (
                      <span className="font-mono text-xs text-muted-foreground">
                        papermark.com/{link.slug}
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      ID: {link.id.substring(0, 15)}...
                    </span>
                  </div>
                );
              }}
              renderTrigger={(selectedOption) => {
                if (!selectedOption) return null;
                const link = selectedOption.meta as Link;
                if (!link) return selectedOption.label;

                return (
                  <div className="flex w-full flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">
                        {link.displayName}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {link.linkType === "DOCUMENT_LINK"
                          ? "Document"
                          : "Dataroom"}
                      </Badge>
                    </div>
                    {link.resourceName && (
                      <div className="flex truncate text-xs text-muted-foreground">
                        {link.resourceName}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allow-list">Allowed Emails & Domains *</Label>
            <Textarea
              id="allow-list"
              value={allowListInput}
              onChange={(e) => setAllowListInput(e.target.value)}
              placeholder={`Enter allowed emails/domains, one per line:
john@company-a.com
jane@company-a.com
@company-b.com`}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Prefix domains with @ (e.g., @company.com). One entry per line.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : step
                  ? "Update Step"
                  : "Create Step"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
