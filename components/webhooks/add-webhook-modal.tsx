import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";
import { Input } from "../ui/input";
import useDocuments from "@/lib/swr/use-documents";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

export function AddWebhookModal({ children }: { children: React.ReactNode }) {
  const events = [{ key: "Link.Viewed" }, { key: "Link.Downloaded" }];
  const { documents } = useDocuments();
  const [uploading, setUploading] = useState<boolean>(false);
  const [target, setTarget] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [eventArray, setEventArray] = useState([
    "Link.Viewed",
    "Link.Downloaded",
  ]);

  const handleWebhookSubmit = async (event: any) => {
    event.preventDefault();

    // Check if the file is chosen

    try {
      setUploading(true);

      // create a document in the database if the document is a pdf
      const response = await saveWebhookToDatabase(
        target,
        documentId,
        eventArray
      );

      if (response) {
        setTimeout(() => {
          console.log(response);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
    }
  };

  async function saveWebhookToDatabase(
    target: string,
    documentId: string,
    event: string[]
  ) {
    // create a document in the database with the blob url
    const eventStringified = JSON.stringify(event);
    console.log(eventStringified);
    const response = await fetch("/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        documentId,
        events: event,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  const handleDocumentChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    console.log(value);

    if (value === "") {
      // Redirect to the add domain page
      return;
    }
    setDocumentId(value);
  };

  const handleEventSelect = (value: string | boolean, event: string) => {
    console.log(value, event);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="text-foreground bg-background">
        <DialogHeader>
          <DialogTitle>Add a Webhook Event</DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                After you upload the document, a shareable link will be
                generated and copied to your clipboard.
              </p>
            </div>
            <form
              encType="multipart/form-data"
              onSubmit={handleWebhookSubmit}
              className="flex flex-col"
            >
              <div className="space-y-1">
                <div className="pb-1 mt-1">
                  <Input
                    placeholder="Enter your endpoint url"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
                <div className="pb-1 mt-1">
                  <select
                    value={documentId}
                    onChange={handleDocumentChange}
                    className={cn("rounded-r-md border-r-1")}
                  >
                    {documents
                      // ?.filter((domain) => domain.verified)
                      ?.map((document) => (
                        <option key={document.id} value={document.id}>
                          {document.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="pb-1 mt-1 flex">
                  {events.map((event) => {
                    return (
                      <div key={event.key}>
                        <Label>{event.key}</Label>
                        <Checkbox
                          onCheckedChange={(checked) =>
                            handleEventSelect(checked, event.key)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full lg:w-1/2"
                  disabled={uploading}
                  loading={uploading}
                >
                  {uploading ? "Creating Webhook" : "Create Webhook"}
                </Button>
              </div>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
