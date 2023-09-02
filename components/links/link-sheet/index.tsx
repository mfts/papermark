import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import PasswordSection from "./password-section"
import ExpirationSection from "./expiration-section";
import EmailProtectionSection from "./email-protection-section";
import { useRouter } from "next/router";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const DEFAULT_LINK_PROPS = {
  id: null,
  name: null,
  expiresAt: null,
  password: null,
  emailProtected: true,
};

export type DEFAULT_LINK_TYPE = {
  id: string | null;
  name: string | null;
  expiresAt: Date | null;
  password: string | null;
  emailProtected: boolean;
};


export default function LinkSheet({ isOpen, setIsOpen, currentLink }: { isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>>, currentLink?: DEFAULT_LINK_TYPE }) {
  const { links } = useDocumentLinks();
  const [data, setData] = useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const documentId = router.query.id as string;

  useEffect(() => {
    setData(currentLink || DEFAULT_LINK_PROPS);
  }, [currentLink]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);

    let endpoint = "/api/links";
    let method = "POST";

    if (currentLink) {
      // Assuming that your endpoint to update links appends the link's ID to the URL
      endpoint = `/api/links/${currentLink.id}`;
      method = "PUT";
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        documentId: documentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const returnedLink = await response.json();

    if (currentLink) {
      // Update the link in the list of links
      mutate(
        `/api/documents/${encodeURIComponent(documentId)}/links`,
        (links || []).map(link => link.id === currentLink.id ? returnedLink : link),
        false
      );
      toast.success("Link updated successfully");
    } else {
      // Add the new link to the list of links
      mutate(
        `/api/documents/${encodeURIComponent(documentId)}/links`,
        [...(links || []), returnedLink],
        false
      );
      toast.success("Link created successfully");
    }

    

    setData(DEFAULT_LINK_PROPS);
    setIsLoading(false);
  }

  

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <SheetContent className="bg-background text-foreground flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle>Create a new link</SheetTitle>
          <SheetDescription>
            Customize a document link for sharing. Click save when you&apos;re
            done.
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col grow" onSubmit={handleSubmit}>
          <div className="h-0 flex-1">
            <div className="flex flex-1 flex-col justify-between">
              <div className="divide-y divide-gray-200">
                <div className="space-y-6 pb-5 pt-6">
                  <div>
                    <label
                      htmlFor="project-name"
                      className="block text-sm font-medium leading-6 text-foreground"
                    >
                      Link Name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="link-name"
                        id="link-name"
                        placeholder="Recipient's Organization"
                        value={data.name || ""}
                        className="flex w-full rounded-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                        onChange={(e) =>
                          setData({ ...data, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center relative">
                    <Separator className="bg-muted-foreground absolute" />
                    <div className="relative mx-auto">
                      <span className="px-2 bg-background text-muted-foreground text-sm">
                        Optional
                      </span>
                    </div>
                  </div>

                  <div>
                    <PasswordSection {...{ data, setData }} />
                    <ExpirationSection {...{ data, setData }} />
                    <EmailProtectionSection {...{ data, setData }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter>
            <div className="flex items-center">
              <SheetClose asChild>
                <Button type="submit">
                  {currentLink ? "Update Link" : "Save Link"}
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
