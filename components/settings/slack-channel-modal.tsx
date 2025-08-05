"use client";

import { useEffect, useState } from "react";

import { Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  is_member?: boolean;
}

interface SlackChannelConfig {
  id: string;
  name: string;
  enabled: boolean;
  notificationTypes: string[];
}

interface SlackChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onChannelsUpdate: (channels: Record<string, SlackChannelConfig>) => void;
  currentChannels?: Record<string, SlackChannelConfig>;
}

const NOTIFICATION_TYPES = [
  { id: "document_view", label: "Document Views", emoji: "📄" },
  { id: "dataroom_access", label: "Dataroom Access", emoji: "🏢" },
  { id: "document_download", label: "Document Downloads", emoji: "⬇️" },
  { id: "document_reaction", label: "Document Reactions", emoji: "👍" },
  { id: "digest", label: "Digest Summaries", emoji: "📊" },
];

export default function SlackChannelModal({
  open,
  onOpenChange,
  teamId,
  onChannelsUpdate,
  currentChannels = {},
}: SlackChannelModalProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannels, setSelectedChannels] =
    useState<Record<string, SlackChannelConfig>>(currentChannels);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch channels when modal opens
  useEffect(() => {
    if (open) {
      fetchChannels();
    }
  }, [open, teamId]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/slack/channels`);
      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error("Error fetching channels:", error);
      toast.error("Failed to fetch Slack channels");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channelId: string, channelName: string) => {
    setSelectedChannels((prev) => {
      const newChannels = { ...prev };
      if (newChannels[channelId]) {
        delete newChannels[channelId];
      } else {
        newChannels[channelId] = {
          id: channelId,
          name: channelName,
          enabled: true,
          notificationTypes: ["document_view", "dataroom_access"],
        };
      }
      return newChannels;
    });
  };

  const handleNotificationTypeToggle = (
    channelId: string,
    notificationType: string,
  ) => {
    setSelectedChannels((prev) => {
      const channel = prev[channelId];
      if (!channel) return prev;

      const newChannels = { ...prev };
      newChannels[channelId] = {
        ...channel,
        notificationTypes: channel.notificationTypes.includes(notificationType)
          ? channel.notificationTypes.filter(
              (type) => type !== notificationType,
            )
          : [...channel.notificationTypes, notificationType],
      };
      return newChannels;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onChannelsUpdate(selectedChannels);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving channel settings:", error);
      toast.error("Failed to save channel settings");
    } finally {
      setSaving(false);
    }
  };

  const isChannelSelected = (channelId: string) => {
    return !!selectedChannels[channelId];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Configure Slack Channels</DialogTitle>
          <DialogDescription>
            Select which channels should receive notifications and configure
            what types of events to send.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading channels...</span>
            </div>
          ) : channels.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No channels found. Make sure your Slack app has been added to the
              channels you want to use.
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="rounded-lg border p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{channel.name}</span>
                      {channel.is_private && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                      {channel.is_archived && (
                        <Badge variant="outline" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <Checkbox
                      checked={isChannelSelected(channel.id)}
                      onCheckedChange={() =>
                        handleChannelToggle(channel.id, channel.name)
                      }
                    />
                  </div>

                  {isChannelSelected(channel.id) && (
                    <div className="mt-2 space-y-2">
                      <p className="mb-2 text-sm text-muted-foreground">
                        Notification types for this channel:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {NOTIFICATION_TYPES.map((notificationType) => (
                          <div
                            key={notificationType.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={selectedChannels[
                                channel.id
                              ]?.notificationTypes.includes(
                                notificationType.id,
                              )}
                              onCheckedChange={() =>
                                handleNotificationTypeToggle(
                                  channel.id,
                                  notificationType.id,
                                )
                              }
                            />
                            <span className="text-sm">
                              {notificationType.emoji} {notificationType.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
