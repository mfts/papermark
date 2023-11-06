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
import { pdfjs } from "react-pdf";
import { Button } from "../ui/button";
import { Dispatch, SetStateAction } from "react";
import { Input } from "../ui/input";
import { PlusIcon } from "@heroicons/react/24/solid";
import DomainSection from "../links/link-sheet/domain-section";
import { useDomains } from "@/lib/swr/use-domains";
import { DEFAULT_LINK_TYPE, DEFAULT_LINK_PROPS } from "../links/link-sheet";
import { Label } from "../ui/label";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export function InviteRecipientModal(
  { isOpen,
    setIsOpen
  }:
    {
      isOpen: boolean,
      setIsOpen: Dispatch<SetStateAction<boolean>>
    }) {
  const router = useRouter();
  const [uploading, setUploading] = useState<boolean>(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState<string>('');
  const { domains } = useDomains();
  const [data, setData] = useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);

  const removeEmail = (index: number) => {
    const updatedEmails = [...emails];
    updatedEmails.splice(index, 1);
    setEmails(updatedEmails);
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>Open</DialogTrigger>
      <DialogContent className="text-foreground bg-background">
        <DialogHeader>
          <DialogTitle>Invite a recipient</DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2">
              <p className="mb-1 text-sm text-muted-foreground">
                An invitation link will be send to chosen individuals
              </p>
            </div>
            <div className="space-y-2 mt-3">
              <DomainSection {...{ data, setData, domains, section: "invite-recipient" }} />
            </div>
            <div className="mt-3">
            <Label htmlFor="email">Email</Label>
            </div>
            <div className="flex justify-center mt-2 mb-2">

              <Input
                className="w-full mr-3"
                placeholder={"Please enter an email..."}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button
                type="button"
                className="mt-1 inline-flex items-center px-2 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-foreground bg-gray-600 hover:bg-gray-500 h-[2rem] w-[2rem]"
                onClick={() => {
                  console.log("sffsdfsdf" + newEmail);
                  if (newEmail) {
                  setEmails([...emails, newEmail])
                  }
                }}
              >
                <PlusIcon className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-2 rounded-md">
              {emails.map((email, index) => (
                <div
                  key={index}
                  className="bg-gray-400 text-gray-700 px-2 py-1 rounded-full flex items-center"
                >
                  <span>{email}</span>
                  <button
                    className="ml-2 text-gray-600"
                    onClick={() => removeEmail(index)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-1">
              <Button
                type="submit"
                className="w-full lg:w-1/2"
                disabled={uploading}
                loading={uploading}
              >
                {uploading ? "Sending Invitation Link..." : "Send Invitation Link"}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}