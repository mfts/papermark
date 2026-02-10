"use client";

import { useState } from "react";

import { Copy, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SAMLConnection {
  clientID: string;
  clientSecret: string;
  name?: string;
  description?: string;
  idpMetadata?: {
    provider?: string;
  };
}

interface SAMLConfigModalProps {
  teamId: string;
  connections: SAMLConnection[];
  onUpdate: () => void;
}

export function SAMLConfigModal({
  teamId,
  connections,
  onUpdate,
}: SAMLConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("azure");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [rawMetadata, setRawMetadata] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "xml">("url");

  const acsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/auth/saml/callback`;
  const entityId =
    process.env.NEXT_PUBLIC_SAML_AUDIENCE ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    window.location.origin;

  const providerOptions = [
    { value: "azure", label: "Microsoft Entra ID (Azure AD)" },
    { value: "okta", label: "Okta" },
    { value: "google", label: "Google Workspace" },
    { value: "custom", label: "Custom SAML IdP" },
  ];

  const providerName =
    providerOptions.find((p) => p.value === provider)?.label || provider;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, string> = {
        name: providerName,
        description: `SAML SSO via ${providerName}`,
      };

      if (inputMode === "url") {
        if (!metadataUrl) {
          toast.error("Please enter a metadata URL");
          setLoading(false);
          return;
        }
        body.metadataUrl = metadataUrl;
      } else {
        if (!rawMetadata) {
          toast.error("Please enter the XML metadata");
          setLoading(false);
          return;
        }
        body.rawMetadata = rawMetadata;
      }

      const res = await fetch(`/api/teams/${teamId}/saml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create SAML connection");
      }

      toast.success("SAML SSO configured successfully!");
      setOpen(false);
      setMetadataUrl("");
      setRawMetadata("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to configure SAML SSO");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(connection: SAMLConnection) {
    if (
      !confirm(
        "Are you sure you want to remove this SAML connection? Users will no longer be able to sign in via SSO.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}/saml`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientID: connection.clientID,
          clientSecret: connection.clientSecret,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete SAML connection");
      }

      toast.success("SAML connection removed");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove SAML connection");
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  return (
    <div className="space-y-4">
      {/* Existing connections */}
      {connections.length > 0 && (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.clientID}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {conn.name || "SAML Connection"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Client ID: {conn.clientID}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(conn)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* IdP Configuration Info */}
      {connections.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-medium">
            Identity Provider Configuration
          </h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Use these values when configuring your Identity Provider:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">
                  Entity ID (Identifier)
                </Label>
                <p className="text-xs text-muted-foreground">{entityId}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(entityId, "Entity ID")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">
                  Reply URL (ACS URL)
                </Label>
                <p className="text-xs text-muted-foreground">{acsUrl}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(acsUrl, "ACS URL")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add new connection dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant={connections.length > 0 ? "outline" : "default"}>
            <Shield className="mr-2 h-4 w-4" />
            {connections.length > 0
              ? "Add Another Connection"
              : "Configure SAML SSO"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure SAML Single Sign-On</DialogTitle>
            <DialogDescription>
              Connect your Identity Provider to enable SSO for your team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Show ACS URL and Entity ID */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Step 1: Add these to your IdP&apos;s SAML configuration
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Entity ID:</span>
                  <div className="flex items-center space-x-1">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      {entityId}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(entityId, "Entity ID")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">ACS URL:</span>
                  <div className="flex items-center space-x-1">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      {acsUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acsUrl, "ACS URL")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Provider selection */}
            <div className="space-y-2">
              <Label>SAML Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Metadata input */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label>
                  Step 2: Paste your IdP metadata
                </Label>
                <div className="flex rounded-md border text-xs">
                  <button
                    type="button"
                    className={`px-2 py-1 ${inputMode === "url" ? "bg-muted font-medium" : ""}`}
                    onClick={() => setInputMode("url")}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 ${inputMode === "xml" ? "bg-muted font-medium" : ""}`}
                    onClick={() => setInputMode("xml")}
                  >
                    XML
                  </button>
                </div>
              </div>

              {inputMode === "url" ? (
                <Input
                  placeholder={
                    provider === "azure"
                      ? "https://login.microsoftonline.com/.../federationmetadata/2007-06/federationmetadata.xml"
                      : "Paste your App Federation Metadata URL"
                  }
                  value={metadataUrl}
                  onChange={(e) => setMetadataUrl(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <textarea
                  placeholder="Paste your SAML metadata XML here..."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={rawMetadata}
                  onChange={(e) => setRawMetadata(e.target.value)}
                  disabled={loading}
                />
              )}

              {provider === "azure" && (
                <p className="text-xs text-muted-foreground">
                  Find this in Azure Portal → Enterprise Applications → Your
                  App → Single sign-on → SAML Certificates → App Federation
                  Metadata URL
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={loading}>
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
