import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Link } from "@prisma/client"
import PasswordSection from "./password-section"
import ExpirationSection from "./expiration-section";
import EmailProtectionSection from "./email-protection-section";
import { useRouter } from "next/router";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { mutate } from "swr";



export default function LinkSheet({ children }: { children: React.ReactNode }) {
  const { links } = useDocumentLinks();
  const [data, setData] = useState<Link>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const documentId = router.query.id as string;

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);
    const response = await fetch("/api/links", {
      method: "POST",
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

    const newLink = await response.json();

    // Update local data with the new link
    mutate(
      `/api/documents/${encodeURIComponent(documentId)}/links`,
      [...(links || []), newLink],
      false
    );

    setIsLoading(false);

  }

  

  return (
    <Sheet>
      <SheetTrigger>{children}</SheetTrigger>
      <SheetContent className="bg-black text-white flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle className="text-white">Create a new link</SheetTitle>
          <SheetDescription className="text-white">
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col grow"
          onSubmit={handleSubmit}
        >
          <div className="h-0 flex-1">
            <div className="flex flex-1 flex-col justify-between">
              <div className="divide-y divide-gray-200">
                <div className="space-y-6 pb-5 pt-6">
                  <div>
                    <label
                      htmlFor="project-name"
                      className="block text-sm font-medium leading-6 text-white"
                    >
                      Link name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="link-name"
                        id="link-name"
                        placeholder="Recipient's Organization"
                        value={data.name ? data.name : null}
                        className="block w-full rounded-md border-0 py-1.5 text-white bg-black shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6"
                        onChange={(e) =>
                          setData({ ...data, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center relative">
                    <Separator className="bg-gray-500 absolute" />
                    <div className="relative mx-auto">
                      <span className="px-2 bg-black text-gray-500 text-sm">
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
              {/* <div className="flex text-sm">
              <a
                href="#"
                className="group inline-flex items-center text-gray-500 hover:text-gray-400"
              >
                <QuestionMarkCircleIcon
                  className="h-5 w-5 text-gray-400 group-hover:text-gray-300"
                  aria-hidden="true"
                />
                <span className="ml-2">Learn more about sharing</span>
              </a>
            </div> */}
              <SheetClose asChild>
                <button
                  type="submit"
                  className="ml-4 inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-950 shadow-sm hover:bg-gray-200 w-24"
                >
                  Save
                </button>
              </SheetClose>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
