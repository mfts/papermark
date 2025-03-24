import { useState } from "react";

import { AlertTriangle, ArchiveIcon } from "lucide-react";

import LinkSheet from "@/components/links/link-sheet";
import { Button } from "@/components/ui/button";

import { useDataroomLinks } from "@/lib/swr/use-dataroom";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "../ui/alert";

export const DataroomHeader = ({
  title,
  description,
  actions,
  isArchived,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode[];
  isArchived?: boolean;
}) => {
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const { links } = useDataroomLinks();

  const actionRows: React.ReactNode[][] = [];
  if (actions) {
    for (let i = 0; i < actions.length; i += 3) {
      actionRows.push(actions.slice(i, i + 3));
    }
  }

  return (
    <section className="mb-4">
      <div className="flex justify-between space-x-2">
        <div className="flex min-h-10 flex-col items-start space-y-2">
          <div className="flex items-center gap-x-2">
            <h1
              className={cn(
                "truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
                isArchived && "text-muted-foreground",
              )}
            >
              {title}
            </h1>
            {isArchived && (
              <span className="flex items-center gap-x-1 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                <ArchiveIcon className="h-4 w-4" />
                Archived
              </span>
            )}
          </div>
          {isArchived && (
            <Alert variant="destructive" className="m-0 pb-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center">
                <span>
                  This dataroom is archived. All links are frozen, documents and
                  folders cannot be modified, and content is read-only.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex gap-x-1">
          <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
            Share
          </Button>
        </div>
        <LinkSheet
          linkType={"DATAROOM_LINK"}
          isOpen={isLinkSheetOpen}
          setIsOpen={setIsLinkSheetOpen}
          existingLinks={links}
        />
      </div>
    </section>
  );
};
