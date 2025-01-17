import Link from "next/link";

import { useState } from "react";

import LinkSheet from "@/components/links/link-sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export const DataroomHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode[];
}) => {
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  const actionRows: React.ReactNode[][] = [];
  if (actions) {
    for (let i = 0; i < actions.length; i += 3) {
      actionRows.push(actions.slice(i, i + 3));
    }
  }

  return (
    <section className="mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/datarooms">All Datarooms</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-medium text-foreground">{title}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex min-h-10 items-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-x-1">
          <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
            Share
          </Button>
        </div>
        <LinkSheet
          linkType={"DATAROOM_LINK"}
          isOpen={isLinkSheetOpen}
          setIsOpen={setIsLinkSheetOpen}
        />
      </div>
    </section>
  );
};
