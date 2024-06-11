import { useRouter } from "next/router";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import { set } from "ts-pattern/dist/patterns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { LinkWithViews } from "@/lib/types";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";

export default function AgreementSheet({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const [data, setData] = useState({ name: "", link: "" });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/agreements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
        }),
      });

      if (!response.ok) {
        // handle error with toast message
        toast.error("Error creating agreement");
        return;
      }

      // Update the agreements list
      mutate(`/api/teams/${teamId}/agreements`);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex w-[85%] flex-col justify-between bg-background px-4 text-foreground sm:w-[500px] md:px-5">
        <SheetHeader className="text-start">
          <SheetTitle>Create a new agreement</SheetTitle>
          <SheetDescription>
            An agreement is a special document that visitors must accept before
            accessing your link. You can create a new agreement here.
          </SheetDescription>
        </SheetHeader>

        <form className="flex grow flex-col" onSubmit={handleSubmit}>
          <div className="flex-grow space-y-6">
            <div className="w-full space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                id="name"
                type="text"
                name="name"
                required
                autoComplete="off"
                data-1p-ignore
                placeholder="Standard NDA"
                value={data.name || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                id="link"
                type="url"
                pattern="https://.*"
                name="link"
                required
                autoComplete="off"
                data-1p-ignore
                placeholder="https://www.papermark.io/nda"
                value={data.link || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    link: e.target.value,
                  })
                }
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    "Please enter a valid URL starting with https://",
                  )
                }
              />
            </div>
          </div>

          <SheetFooter>
            <div className="flex items-center">
              <Button type="submit" loading={isLoading}>
                Create Agreement
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
