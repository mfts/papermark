"use client";

import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type DirectoryProvider =
  | "azure-scim-v2"
  | "okta-scim-v2"
  | "onelogin-scim-v2"
  | "jumpcloud-scim-v2"
  | "generic-scim-v2"
  | "google";

const providerOptions: Array<{ value: DirectoryProvider; label: string }> = [
  { value: "azure-scim-v2", label: "Microsoft Entra ID" },
  { value: "okta-scim-v2", label: "Okta" },
  { value: "google", label: "Google" },
  { value: "onelogin-scim-v2", label: "OneLogin" },
  { value: "jumpcloud-scim-v2", label: "JumpCloud" },
  { value: "generic-scim-v2", label: "Custom" },
];

type DirectorySyncConfigModalProps = {
  open: boolean;
  teamId: string;
  onOpenChange: (open: boolean) => void;
  onConfigured?: (directory: unknown) => void;
};

export function DirectorySyncConfigModal(props: DirectorySyncConfigModalProps) {
  const { open, teamId, onOpenChange, onConfigured } = props;

  const [provider, setProvider] = useState<DirectoryProvider>("azure-scim-v2");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/directory-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: provider,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to configure directory sync.");
      }

      toast.success("Directory Sync configured successfully.");
      onConfigured?.(payload);
      onOpenChange(false);
      setProvider("azure-scim-v2");
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to configure directory sync.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Directory Sync (SCIM)</DialogTitle>
          <DialogDescription>
            Create a SCIM 2.0 directory connection for automated user provisioning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="directory-provider">Directory Provider</Label>
          <select
            id="directory-provider"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as DirectoryProvider)
            }
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
