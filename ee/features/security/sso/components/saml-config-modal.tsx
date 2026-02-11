"use client";

import { useState } from "react";

import { Copy, Shield, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import useSAML from "@/lib/swr/use-saml";
import { copyToClipboard } from "@/lib/utils";

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

import { type SAMLProviderKey, SAML_PROVIDERS } from "../constants";

interface SAMLConfigModalProps {
  teamId: string;
}

export function SAMLConfigModal({ teamId }: SAMLConfigModalProps) {
  const { connections, issuer, acs, mutate, loading } = useSAML();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    SAMLProviderKey | undefined
  >();
  const [metadataUrl, setMetadataUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState("");

  const currentProvider = SAML_PROVIDERS.find(
    (p) => p.saml === selectedProvider,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body: Record<string, string> = {};

      if (selectedProvider === "google") {
        if (!fileContent) {
          toast.error("Please upload the XML metadata file");
          setSubmitting(false);
          return;
        }
        body.encodedRawMetadata = btoa(fileContent);
      } else {
        if (!metadataUrl) {
          toast.error("Please enter a metadata URL");
          setSubmitting(false);
          return;
        }
        body.metadataUrl = metadataUrl;
      }

      // Include the explicit SSO email domain if provided by the admin
      if (domain.trim()) {
        body.domain = domain.trim();
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
      setDomain("");
      setFile(null);
      setFileContent("");
      setSelectedProvider(undefined);
      await mutate();
    } catch (error: any) {
      toast.error(error.message || "Failed to configure SAML SSO");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(conn: any) {
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
          clientID: conn.clientID,
          clientSecret: conn.clientSecret,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete SAML connection");
      }

      toast.success("SAML connection removed");
      await mutate();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove SAML connection");
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Loading SAML configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing connections */}
      {connections.length > 0 && (
        <div className="space-y-3">
          {connections.map((conn: any) => (
            <div
              key={conn.clientID}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {conn.idpMetadata?.provider || "SAML Connection"}
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
                <p className="text-xs text-muted-foreground">{issuer}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(issuer, "Entity ID copied to clipboard")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">
                  Reply URL (ACS URL)
                </Label>
                <p className="text-xs text-muted-foreground">{acs}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(acs, "ACS URL copied to clipboard")}
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
          <Button
            className="w-full"
            variant={connections.length > 0 ? "outline" : "default"}
          >
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
                      {issuer || "https://saml.papermark.com"}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          issuer || "https://saml.papermark.com",
                          "Entity ID copied to clipboard",
                        )
                      }
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
                      {acs ||
                        `${window.location.origin}/api/auth/saml/callback`}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          acs ||
                            `${window.location.origin}/api/auth/saml/callback`,
                          "ACS URL copied to clipboard",
                        )
                      }
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
              <Label>Step 2: Select SAML Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(v) => setSelectedProvider(v as SAMLProviderKey)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {SAML_PROVIDERS.map((p) => (
                    <SelectItem key={p.saml} value={p.saml}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Metadata input */}
            {currentProvider && (
              <div className="space-y-2">
                <Label>Step 3: {currentProvider.samlModalCopy}</Label>

                {selectedProvider === "google" ? (
                  <label
                    htmlFor="metadataRaw"
                    className="group relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 transition-all hover:bg-muted/50"
                  >
                    {file ? (
                      <>
                        <UploadCloud className="h-5 w-5 text-green-600" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {file.name}
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Upload .xml metadata file
                        </p>
                      </>
                    )}
                    <input
                      id="metadataRaw"
                      type="file"
                      accept="text/xml,.xml"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target?.files?.[0];
                        setFile(f || null);
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFileContent(ev.target?.result as string);
                          };
                          reader.readAsText(f);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <Input
                    placeholder={
                      selectedProvider === "azure"
                        ? "https://login.microsoftonline.com/.../federationmetadata/..."
                        : "https://your-idp.example.com/metadata"
                    }
                    value={metadataUrl}
                    onChange={(e) => setMetadataUrl(e.target.value)}
                    disabled={submitting}
                  />
                )}
              </div>
            )}

            {/* Step 4: SSO Email Domain */}
            {currentProvider && (
              <div className="space-y-2">
                <Label htmlFor="ssoDomain">
                  Step 4: SSO Email Domain
                </Label>
                <Input
                  id="ssoDomain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  The email domain used by your organization (e.g.,
                  example.com). Only users with this domain will be able to
                  sign in via SSO.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting || !selectedProvider}
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
