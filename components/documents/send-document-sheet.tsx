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
import { useRouter } from "next/router";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/utils";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import Link from "next/link";
import DomainSection from "../links/link-sheet/domain-section";

export const DEFAULT_LINK_PROPS = {
  id: null,
  name: null,
  domain: null,
  slug: null,
  expiresAt: null,
  password: null,
  emailProtected: true,
  allowDownload: false,
};

export type DEFAULT_LINK_TYPE = {
  id: string | null;
  name: string | null;
  domain: string | null;
  slug: string | null;
  expiresAt: Date | null;
  password: string | null;
  emailProtected: boolean;
  allowDownload: boolean;
};

export default function SendDocumentSheet({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { links } = useDocumentLinks();
  const { domains } = useDomains();
  const [data, setData] = useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState<string>('');


  const removeEmail = (index: number) => {
    const updatedEmails = [...emails];
    updatedEmails.splice(index, 1);
    setEmails(updatedEmails);
  };

  const router = useRouter();
  const documentId = router.query.id as string;

  useEffect(() => {
    setData(DEFAULT_LINK_PROPS);
  }, []);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);
  }

  //   const response = await fetch(endpoint, {
  //     method: method,
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       ...data,
  //       documentId: documentId,
  //     }),
  //   });

  //   if (!response.ok) {
  //     // handle error with toast message
  //     const { error } = await response.json();
  //     toast.error(error);
  //     setIsLoading(false);
  //     return;
  //   }

  //   setData(DEFAULT_LINK_PROPS);
  //   setIsLoading(false);
  // };

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
              <div className="divide-y divide-gray-200">
                <div className="space-y-6 pb-5 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="link-name">Email</Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="link-name"
                        id="link-name"
                        placeholder="Recipient's Email"
                        value={data.name || ""}
                        className="flex w-full rounded-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                        onChange={(e) =>
                          setData({ ...data, name: e.target.value })
                        }
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
                  </div>

                  <div className="space-y-2">
                    <DomainSection {...{ data, setData, domains }} />
                  </div>

                  <div className="flex items-center relative">
                    <Separator className="bg-muted-foreground absolute" />
                    <div className="relative mx-auto">
                      <span className="px-2 bg-background text-muted-foreground text-sm">
                        Optional
                      </span>
                    </div>
                  </div>
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

                  {/* <div>
                    <EmailProtectionSection {...{ data, setData }} />
                    <AllowDownloadSection {...{ data, setData }} />
                    <PasswordSection {...{ data, setData }} />
                    <ExpirationSection {...{ data, setData }} />
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter>
            <div className="flex items-center">
              <Button type="submit" disabled={isLoading}>
                Send Invite Link
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}