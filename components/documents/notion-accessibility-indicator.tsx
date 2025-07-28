import { useEffect, useState } from "react";

import { DocumentVersion } from "@prisma/client";
import { AlertCircle, CheckCircle, Edit, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useTeam } from "@/context/team-context";

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
import LoadingSpinner from "@/components/ui/loading-spinner";

interface NotionAccessibilityIndicatorProps {
  documentId: string;
  primaryVersion: DocumentVersion;
  onUrlUpdate?: () => void;
}

interface AccessibilityStatus {
  isAccessible: boolean;
  url: string;
  statusCode?: number;
  lastChecked: string;
  error?: string;
}

export default function NotionAccessibilityIndicator({
  documentId,
  primaryVersion,
  onUrlUpdate,
}: NotionAccessibilityIndicatorProps) {
  const teamInfo = useTeam();
  const [status, setStatus] = useState<AccessibilityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Only render for Notion documents
  if (primaryVersion.type !== "notion") {
    return null;
  }

  const checkAccessibility = async () => {
    if (!teamInfo?.currentTeam?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/documents/${documentId}/check-notion-accessibility`,
      );
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
      } else {
        toast.error("Failed to check accessibility");
      }
    } catch (error) {
      console.error("Error checking accessibility:", error);
      toast.error("Failed to check accessibility");
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotionUrl = async () => {
    if (!teamInfo?.currentTeam?.id || !newUrl.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/documents/${documentId}/update-notion-url`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notionUrl: newUrl.trim() }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Notion URL updated successfully");
        setIsDialogOpen(false);
        setNewUrl("");
        // Refresh accessibility status
        await checkAccessibility();
        // Trigger parent component update if provided
        if (onUrlUpdate) {
          onUrlUpdate();
        }
      } else {
        toast.error(data.message || "Failed to update URL");
      }
    } catch (error) {
      console.error("Error updating URL:", error);
      toast.error("Failed to update URL");
    } finally {
      setIsUpdating(false);
    }
  };

  const openNotionPage = () => {
    if (status?.url) {
      window.open(status.url, "_blank");
    }
  };

  // Check accessibility on component mount
  useEffect(() => {
    checkAccessibility();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) {
      return <LoadingSpinner className="h-4 w-4" />;
    }
    
    if (status?.isAccessible) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (isLoading) {
      return "Checking accessibility...";
    }
    
    if (status?.isAccessible) {
      return "Publicly accessible";
    } else if (status?.error) {
      return "Unable to check";
    } else {
      return "Not publicly accessible";
    }
  };

  const getStatusColor = () => {
    if (isLoading) {
      return "text-gray-500";
    }
    
    if (status?.isAccessible) {
      return "text-green-600";
    } else {
      return "text-red-600";
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={checkAccessibility}
          disabled={isLoading}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>

        {status?.url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openNotionPage}
            className="h-7 px-2"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setNewUrl(status?.url || "")}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Notion URL</DialogTitle>
              <DialogDescription>
                Change the URL of the Notion page for this document.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notion-url">Notion URL</Label>
                <Input
                  id="notion-url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.notion.so/your-page-url"
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={updateNotionUrl}
                disabled={isUpdating || !newUrl.trim()}
              >
                {isUpdating ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update URL"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {status?.lastChecked && (
        <div className="text-xs text-gray-400 mt-1">
          Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}