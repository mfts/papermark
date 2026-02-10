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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SAMLProvider = "azure" | "okta" | "google" | "custom";

const providerOptions: Array<{ value: SAMLProvider; label: string }> = [
  { value: "azure", label: "Microsoft Entra ID" },
  { value: "okta", label: "Okta" },
  { value: "google", label: "Google" },
  { value: "custom", label: "Custom" },
];

type SAMLConfigModalProps = {
  open: boolean;
  teamId: string;
  onOpenChange: (open: boolean) => void;
  onConfigured?: (connection: unknown) => void;
};

export function SAMLConfigModal(props: SAMLConfigModalProps) {
  const { open, teamId, onOpenChange, onConfigured } = props;

  const [provider, setProvider] = useState<SAMLProvider>("azure");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [rawMetadata, setRawMetadata] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave =
    !saving && (metadataUrl.trim().length > 0 || rawMetadata.trim().length > 0);

  async function handleSave() {
    if (!canSave) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/saml`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          metadataUrl: metadataUrl.trim() || undefined,
          rawMetadata: rawMetadata.trim() || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to configure SAML.");
      }

      toast.success("SAML connection configured successfully.");
      onConfigured?.(payload);
      onOpenChange(false);
      setMetadataUrl("");
      setRawMetadata("");
      setProvider("azure");
    } catch (error) {
      toast.error((error as Error).message || "Failed to configure SAML.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Configure SAML Single Sign-On</DialogTitle>
          <DialogDescription>
            Add your identity provider metadata to enable SSO for this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="saml-provider">SAML Provider</Label>
            <select
              id="saml-provider"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value as SAMLProvider)
              }
            >
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata-url">App Federation Metadata URL</Label>
            <Input
              id="metadata-url"
              placeholder="https://login.microsoftonline.com/.../federationmetadata.xml"
              value={metadataUrl}
              onChange={(event) => setMetadataUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Preferred for Microsoft Entra ID. Paste your metadata URL here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw-metadata">Raw XML Metadata (optional)</Label>
            <Textarea
              id="raw-metadata"
              rows={6}
              placeholder="<EntityDescriptor ...>...</EntityDescriptor>"
              value={rawMetadata}
              onChange={(event) => setRawMetadata(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSave} loading={saving} onClick={handleSave}>
            Save configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
