"use client";

import { useState } from "react";

import { Copy, Eye, EyeOff, FolderSync, Trash2 } from "lucide-react";
import { toast } from "sonner";

import useSCIM from "@/lib/swr/use-scim";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SAML_PROVIDERS, type SCIMProviderKey } from "../constants";

interface DirectorySyncConfigModalProps {
  teamId: string;
}

export function DirectorySyncConfigModal({
  teamId,
}: DirectorySyncConfigModalProps) {
  const { directories, configured, mutate, loading } = useSCIM();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    SCIMProviderKey | undefined
  >();
  const [showBearerToken, setShowBearerToken] = useState(false);

  const currentProvider = SAML_PROVIDERS.find(
    (p) => p.scim === selectedProvider,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/directory-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedProvider,
          ...(configured && { currentDirectoryId: directories[0]?.id }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create directory sync");
      }

      toast.success("Directory sync configured successfully!");
      await mutate();
    } catch (error: any) {
      toast.error(error.message || "Failed to configure directory sync");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(directoryId: string) {
    if (
      !confirm(
        "Are you sure you want to remove this directory sync connection? User provisioning will stop.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}/directory-sync`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete directory sync");
      }

      toast.success("Directory sync connection removed");
      await mutate();
    } catch (error: any) {
      toast.error(
        error.message || "Failed to remove directory sync connection",
      );
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Loading directory sync configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing directories */}
      {directories.map((dir: any) => (
        <div
          key={dir.id}
          className="space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <FolderSync className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {dir.name || "Directory Sync"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Type: {dir.type}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(dir.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* SCIM endpoint + token */}
          {dir.scim && (
            <div className="space-y-2 rounded-md border bg-muted/50 p-3">
              <div>
                <Label className="text-xs font-medium">SCIM Base URL</Label>
                <div className="mt-1 flex items-center justify-between rounded-md border bg-white px-3 py-1.5">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                    {dir.scim.endpoint}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(dir.scim.endpoint, "SCIM Base URL")
                    }
                    className="ml-2 shrink-0"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Bearer Token</Label>
                <div className="mt-1 flex items-center justify-between rounded-md border bg-white px-3 py-1.5">
                  <input
                    type={showBearerToken ? "text" : "password"}
                    readOnly
                    className="w-full border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0"
                    value={dir.scim.secret}
                  />
                  <div className="flex shrink-0 space-x-1.5 pl-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(dir.scim.secret, "Bearer Token")
                      }
                    >
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBearerToken(!showBearerToken)}
                    >
                      {showBearerToken ? (
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new directory dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full"
            variant={configured ? "outline" : "default"}
          >
            <FolderSync className="mr-2 h-4 w-4" />
            {configured
              ? "Replace Directory Provider"
              : "Configure Directory Sync"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure SCIM Directory Sync</DialogTitle>
            <DialogDescription>
              Select your directory provider to enable automatic user
              provisioning and deprovisioning.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Directory Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(v) =>
                  setSelectedProvider(v as SCIMProviderKey)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {SAML_PROVIDERS.map((p) => (
                    <SelectItem key={p.scim} value={p.scim}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentProvider && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  After creating the directory, you&apos;ll receive a SCIM Base
                  URL and Bearer Token. Configure these in your{" "}
                  {currentProvider.name} admin console.
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
                {configured ? "Replace & Configure" : "Create Directory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
