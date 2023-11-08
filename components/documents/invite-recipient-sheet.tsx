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
import { useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "@heroicons/react/24/solid";
import z from "zod";
import SenderEmailSection from "./sender-email-section";
import { LinkWithViews } from "@/lib/types";

export const DEFAULT_EMAIL_PROPS = {
  username: "invitation",
  domain: "papermark.io"
};

export type DEFAULT_EMAIL_TYPE = {
  username: string | null;
  domain: string | null;
};

const emailSchema = z.string().email();

export default function InviteRecipientSheet({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { domains } = useDomains();
  const { links } = useDocumentLinks();
  const [senderEmail, setSenderEmail] = useState<DEFAULT_EMAIL_TYPE>(DEFAULT_EMAIL_PROPS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState<string>('');
  const [invalidEmailError, setInvalidEmailError] = useState<string>("");

  const removeEmail = (index: number) => {
    const updatedEmails = [...recipientEmails];
    updatedEmails.splice(index, 1);
    setRecipientEmails(updatedEmails);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setIsLoading(true);

    //Use sender email only if domain is verified
    const verifiedDomain = domains?.find(domain => domain.slug === senderEmail.domain)?.verified;
    const link: LinkWithViews | undefined = links ? links[0] : undefined;

    const response = await fetch('/api/emails/invite-recipient', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderEmail: verifiedDomain
          ? `${senderEmail.username}@${senderEmail.domain}`
          : "invitation@papermark.io",
        recipientEmails,
        documentLink: link?.domainId
          ? `https://${link?.domainSlug}/${link?.slug}`
          : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${link?.id}`
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
  };

  // console.log("current Data", data)

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <SheetContent className="bg-background text-foreground flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle>
            Invite Recipients

          </SheetTitle>
          <SheetDescription>
            An invitation link will be send to chosen individuals
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col grow" onSubmit={handleSubmit}>
          <div className="h-0 flex-1">
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-6 pb-5 pt-6">
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

                <div className="flex items-center relative">
                  <Separator className="bg-muted-foreground absolute" />
                  <div className="relative mx-auto">
                    <span className="px-2 bg-background text-muted-foreground text-sm">
                      Recipient emails
                    </span>
                  </div>
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
              <Button type="submit" disabled={isLoading}>
                Send Invitation Links
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}