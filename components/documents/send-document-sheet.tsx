import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useDocument, useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "@heroicons/react/24/solid";
import z from "zod";
import SenderEmailSection from "./sender-email-section";

export const DEFAULT_EMAIL_PROPS = {
  username: "invitation",
  domain: "papermark.io"
};

export type DEFAULT_EMAIL_TYPE = {
  username: string | null;
  domain: string | null;
};

const emailSchema = z.string().email();

export default function SendDocumentSheet({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { domains } = useDomains();
  const [senderEmail, setSenderEmail] = useState<DEFAULT_EMAIL_TYPE>(DEFAULT_EMAIL_PROPS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState<string>('');
  const [invalidEmailError, setInvalidEmailError] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const { document } = useDocument();

  const removeEmail = (index: number) => {
    const updatedEmails = [...recipientEmails];
    updatedEmails.splice(index, 1);
    setRecipientEmails(updatedEmails);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setIsLoading(true);
    if (!recipientEmails.length) {
      setErrorMessage("Please insert recipient email");
      setTimeout(() => setErrorMessage(""), 2000);
      setIsLoading(false);
      return;
    }

    //Use sender email only if domain is verified
    const isEmailDNSVerified = domains?.find(domain => domain.slug === senderEmail.domain)?.emailDNSVerified;

    const response = await fetch('/api/emails/send-document', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderEmail: isEmailDNSVerified
          ? `${senderEmail.username}@${senderEmail.domain}`
          : "invitation@papermark.io",
        recipientEmails,
        blobURL: document?.file,
        filename: document?.name,
        message: emailMessage
      }),
    });

    if (!response.ok) {
      // handle error with toast message
      const { error } = await response.json();
      toast.error(error);
      setIsLoading(false);
      return;
    }

    setSenderEmail(DEFAULT_EMAIL_PROPS);
    setIsLoading(false);
    toast.success("Invitation send successfully");
  };

  // console.log("current Data", data)

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <SheetContent className="bg-background text-foreground flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle>
            Send Document
          </SheetTitle>
          <SheetDescription>
            Send Document to chosen individual
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col grow" onSubmit={handleSubmit}>
          <div className="h-0 flex-1">
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-6 pb-2 pt-6">
                <div className="space-y-2">
                  <SenderEmailSection {...{ email: senderEmail, setEmail: setSenderEmail, domains }} />
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="link-name">Recipient's Email</Label>
                <div className="flex mt-2">
                  <input
                    type="text"
                    name="email-name"
                    id="email-name"
                    placeholder="Add Recipient's Email..."
                    value={newRecipientEmail}
                    className="flex w-full rounded-md mr-2 border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                    onChange={(e) =>
                      setNewRecipientEmail(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center px-2 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-foreground bg-gray-600 hover:bg-gray-500 h-[2rem] w-[2rem]"
                    onClick={() => {
                      try {
                        emailSchema.parse(newRecipientEmail);
                        setRecipientEmails([...recipientEmails, newRecipientEmail]);
                      } catch {
                        setInvalidEmailError("Invalid email, please try again");
                        setTimeout(() => setInvalidEmailError(""), 5000);
                      }
                    }}
                  >
                    <PlusIcon className="h-7 w-7" aria-hidden="true" />
                  </button>
                </div>
                <div className="text-sm text-red-500 mt-4">
                  {invalidEmailError}
                </div>
                <div className="space-y-2 mt-2">
                  <Label htmlFor="link-name">Message</Label>
                  <div className="flex mt-2">
                    <textarea
                      name="email-message"
                      id="email-message"
                      placeholder="Add your message..."
                      value={emailMessage}
                      className="flex w-full rounded-md mr-2 border-0 h-24 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                      onChange={(e) =>
                        setEmailMessage(e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center relative">
                  <Separator className="bg-muted-foreground absolute" />
                  <div className="relative mx-auto">
                    <span className="px-2 bg-background text-muted-foreground text-sm">
                      Recipient emails
                    </span>
                  </div>
                </div>
                <div className="flex item-center">
                  {errorMessage ?
                    <div className="text-sm text-red-500 mt-4 font-bold">
                      {errorMessage}
                    </div> : null}
                </div>
                <div className="flex flex-wrap item-center mt-1">
                  {recipientEmails.map((email, index) => (
                    <div
                      key={index}
                      className="bg-gray-300 bg-opacity-20 mt-1 mr-1 sm:text-sm sm:leading-6 text-gray-400 px-2 py-1 rounded-full flex items-center"
                    >
                      <span>{email}</span>
                      <button
                        className="ml-2 text-gray-400 sm:text-sm sm:leading-6"
                        onClick={() => removeEmail(index)}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter>
            <div className="flex items-center">
              <Button type="submit" disabled={isLoading} loading={isLoading}>
                Send Document
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}