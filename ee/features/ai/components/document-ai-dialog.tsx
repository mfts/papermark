"use client";

import { useState } from "react";

import { Bot, ExternalLink, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { cn } from "@/lib/utils";

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
import { Switch } from "@/components/ui/switch";

interface DocumentAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  teamId: string;
  agentsEnabled: boolean;
  vectorStoreFileId?: string | null;
}

export function DocumentAIDialog({
  open,
  onOpenChange,
  documentId,
  teamId,
  agentsEnabled: initialEnabled,
  vectorStoreFileId,
}: DocumentAIDialogProps) {
  const { isFeatureEnabled } = useFeatureFlags();
  const isAIFeatureEnabled = isFeatureEnabled("ai");

  const [agentsEnabled, setAgentsEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);

  // Don't render if AI feature is not enabled
  if (!isAIFeatureEnabled) {
    return null;
  }

  const handleToggleAgents = async (enabled: boolean) => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentsEnabled: enabled }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update agents setting");
      }

      setAgentsEnabled(enabled);
      toast.success(`AI Agents ${enabled ? "enabled" : "disabled"}`);

      // Mutate the document cache
      await mutate(`/api/teams/${teamId}/documents/${documentId}`);
    } catch (error) {
      console.error("Error toggling agents:", error);
      toast.error("Failed to update agents setting");
      setAgentsEnabled(!enabled);
    } finally {
      setLoading(false);
    }
  };

  const handleIndexDocument = async () => {
    setIndexing(true);

    try {
      const response = await fetch(
        `/api/ai/store/teams/${teamId}/documents/${documentId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to index document");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Document indexed successfully");

      // Mutate the document cache
      await mutate(`/api/teams/${teamId}/documents/${documentId}`);
    } catch (error: any) {
      console.error("Error indexing document:", error);
      toast.error(error.message || "Failed to index document");
    } finally {
      setIndexing(false);
    }
  };

  const isIndexed = !!vectorStoreFileId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Agents
          </DialogTitle>
          <DialogDescription>
            Enable AI-powered chat for this document. Visitors can ask questions
            and get intelligent answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle Section */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="agents-toggle" className="flex flex-col space-y-1">
              <span className="font-medium">Enable AI Chat</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">
                Allow visitors to chat with AI about this document
              </span>
            </Label>
            <Switch
              id="agents-toggle"
              checked={agentsEnabled}
              onCheckedChange={handleToggleAgents}
              disabled={loading}
            />
          </div>

          {/* Index Status */}
          {agentsEnabled && (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Index Status</span>
                <span className="text-xs text-muted-foreground">
                  {isIndexed
                    ? "Document is indexed and ready for AI chat"
                    : "Document needs to be indexed before AI chat can work"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-2 w-2 rounded-full",
                    isIndexed ? "bg-green-500" : "bg-amber-500",
                  )}
                />
                <Button
                  onClick={handleIndexDocument}
                  disabled={indexing}
                  size="sm"
                  variant={isIndexed ? "outline" : "default"}
                >
                  {indexing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Indexing...
                    </>
                  ) : isIndexed ? (
                    "Re-index"
                  ) : (
                    "Index Document"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Privacy & Data Usage
                </p>
                <ul className="space-y-1 text-green-800 dark:text-green-200">
                  <li>• Powered by OpenAI&apos;s API</li>
                  <li>• Your data is NOT used to train AI models</li>
                  <li>• Document embeddings stored securely</li>
                  <li>• Delete anytime by disabling AI</li>
                </ul>
                <a
                  href="https://openai.com/policies/api-data-usage-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline dark:text-green-300"
                >
                  OpenAI Data Usage Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
