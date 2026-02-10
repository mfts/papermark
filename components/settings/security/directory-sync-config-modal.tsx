"use client";

import { useState } from "react";

import { Copy, FolderSync, Trash2 } from "lucide-react";
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

interface DirectoryConnection {
  id: string;
  name?: string;
  type?: string;
  scim?: {
    endpoint?: string;
    secret?: string;
  };
}

interface DirectorySyncConfigModalProps {
  teamId: string;
  directories: DirectoryConnection[];
  onUpdate: () => void;
}

export function DirectorySyncConfigModal({
  teamId,
  directories,
  onUpdate,
}: DirectorySyncConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("azure-scim-v2");
  const [name, setName] = useState("");
  const [newDirectory, setNewDirectory] = useState<DirectoryConnection | null>(
    null,
  );

  const providerOptions = [
    { value: "azure-scim-v2", label: "Microsoft Entra ID" },
    { value: "okta-scim-v2", label: "Okta" },
    { value: "google", label: "Google Workspace" },
    { value: "generic-scim-v2", label: "Generic SCIM v2.0" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const providerLabel =
        providerOptions.find((p) => p.value === provider)?.label || provider;

      const res = await fetch(`/api/teams/${teamId}/directory-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `${providerLabel} SCIM`,
          type: provider,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create directory sync");
      }

      const data = await res.json();
      setNewDirectory(data);

      toast.success("Directory sync configured successfully!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to configure directory sync");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(directoryId: string) {
    if (
      !confirm(
        "Are you sure you want to remove this directory sync? User provisioning will stop.",
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

      toast.success("Directory sync removed");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove directory sync");
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  return (
    <div className="space-y-4">
      {/* Existing directories */}
      {directories.length > 0 && (
        <div className="space-y-3">
          {directories.map((dir) => (
            <div
              key={dir.id}
              className="rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderSync className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {dir.name || "Directory Sync"}
                  </span>
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

              {dir.scim?.endpoint && (
                <div className="mt-3 space-y-2 rounded-md border bg-muted/50 p-3">
                  <div>
                    <Label className="text-xs font-medium">
                      SCIM 2.0 Base URL
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        readOnly
                        value={dir.scim.endpoint}
                        className="h-8 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            dir.scim!.endpoint!,
                            "SCIM Base URL",
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {dir.scim.secret && (
                    <div>
                      <Label className="text-xs font-medium">
                        Bearer Token
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          readOnly
                          type="password"
                          value={dir.scim.secret}
                          className="h-8 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              dir.scim!.secret!,
                              "Bearer Token",
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Copy this token now. It will not be shown again.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new directory dialog */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setNewDirectory(null);
            setName("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            className="w-full"
            variant={directories.length > 0 ? "outline" : "default"}
          >
            <FolderSync className="mr-2 h-4 w-4" />
            {directories.length > 0
              ? "Add Another Directory"
              : "Configure Directory Sync"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Directory Sync</DialogTitle>
            <DialogDescription>
              Enable automatic user provisioning and deprovisioning from your
              Identity Provider.
            </DialogDescription>
          </DialogHeader>

          {newDirectory ? (
            // Show the SCIM credentials after creation
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Directory sync created successfully!
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                  Copy the values below and add them to your Identity
                  Provider&apos;s provisioning settings.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">
                    SCIM 2.0 Base URL (Tenant URL)
                  </Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      readOnly
                      value={newDirectory.scim?.endpoint || ""}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          newDirectory.scim?.endpoint || "",
                          "SCIM Base URL",
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Secret Token (Bearer Token)
                  </Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      readOnly
                      value={newDirectory.scim?.secret || ""}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          newDirectory.scim?.secret || "",
                          "Bearer Token",
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Save this token now — it will not be shown again.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Directory Provider</Label>
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

              <div className="space-y-2">
                <Label>
                  Connection Name{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  placeholder={`e.g., ${providerOptions.find((p) => p.value === provider)?.label || "Directory"} SCIM`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  After creating the directory sync connection, you&apos;ll
                  receive a SCIM 2.0 Base URL and Bearer Token. Add these to
                  your Identity Provider&apos;s provisioning settings.
                </p>
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
                  Create Connection
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
