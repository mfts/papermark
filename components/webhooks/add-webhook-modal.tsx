import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Event } from "@prisma/client";
import { mutate } from "swr";
import { useTeam } from "@/context/team-context";

interface webhookProps {
  eventType: Event;
  displayText: string;
}

const webhooks: webhookProps[] = [
  {
    eventType: "DOCUMENT_ADDED",
    displayText: "document.uploaded",
  },
  {
    eventType: "DOCUMENT_VIEWED",
    displayText: "document.viewed",
  },
  {
    eventType: "DOCUMENT_DELETED",
    displayText: "document.deleted",
  },
];

export function AddWebhookModal({ children }: { children: React.ReactNode }) {
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [urlError, setUrlError] = useState<string>("");
  const [checkboxError, setCheckboxError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const teamInfo = useTeam();

  const handleWebhookCreation = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);

    if (!targetUrl) {
      setCreating(false);
      setUrlError("please enter the endpoint url");
      return;
    }

    if (events.length === 0) {
      setCreating(false);
      setCheckboxError("please select any one of the events");
      return;
    }

    // create a document in the database with the blob url
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/webhooks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUrl,
          events,
        }),
      },
    );

    if (!response.ok) {
      setCreating(false);
      toast.error(`HTTP error! status: ${response.status}`);
      setModalOpen(false);
    }

    setCreating(false);
    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/webhooks`);
    toast.success("Webhook created successfully!");
    setModalOpen(false);
  };

  const handleEventSelect = (value: Event) => {
    console.log("selected");

    if (events.includes(value)) {
      setEvents(events.filter((event) => event !== value));
    } else {
      setEvents([...events, value]);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger onClick={() => setModalOpen(true)} asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="text-foreground bg-background">
        <DialogHeader>
          <DialogTitle>Add Webhook</DialogTitle>
          <DialogDescription>
            <form
              encType="multipart/form-data"
              onSubmit={handleWebhookCreation}
              className="flex flex-col gap-3"
            >
              <div className="my-4 space-y-2">
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="enpoint"
                  placeholder="https://"
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
                {urlError && !targetUrl && (
                  <p className="text-xs text-red-500">{urlError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select events to listen</Label>

                <div className="space-y-3">
                  {webhooks.map((webhook, index) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${index}`}
                        onCheckedChange={() =>
                          handleEventSelect(webhook.eventType)
                        }
                      />
                      <Label htmlFor={`${index}`}>{webhook.displayText}</Label>
                    </div>
                  ))}

                  {checkboxError && (
                    <p className="text-xs text-red-500">{checkboxError}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-start mt-3">
                <Button type="submit" loading={creating}>
                  {creating ? "Creating..." : "Create Webhook"}
                </Button>
              </div>
            </form>
          </DialogDescription>
        </DialogHeader>
        ∆
      </DialogContent>
    </Dialog>
  );
}
