import { useDocument, useDocumentLinks } from "@/lib/swr/use-document";
import ErrorPage from "next/error";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import VisitorsTable from "@/components/visitors/visitors-table";
import { useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useTeam } from "@/context/team-context";
import { StatsComponent } from "@/components/documents/stats";
import DocumentHeader from "@/components/documents/document-header";
import { Button } from "@/components/ui/button";
import { NavMenu } from "@/components/navigation-menu";

export default function DocumentPage() {
  const { document: prismaDocument, primaryVersion, error } = useDocument();
  const { links } = useDocumentLinks();
  const teamInfo = useTeam();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <AppLayout>
      <main className="relative overflow-hidden mx-2 sm:mx-3 md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 px-1">
        {prismaDocument && primaryVersion ? (
          <>
            {/* Action Header */}
            <DocumentHeader
              primaryVersion={primaryVersion}
              prismaDocument={prismaDocument}
              teamId={teamInfo?.currentTeam?.id!}
              actions={[
                <Button
                  key={"create-link"}
                  className="flex h-8 lg:h-9 text-xs lg:text-sm whitespace-nowrap"
                  onClick={() => setIsLinkSheetOpen(true)}
                >
                  Create Link
                </Button>,
              ]}
            />

            {/* <NavMenu
              navigation={[
                {
                  label: "Overview",
                  href: `/documents/${prismaDocument.id}`,
                  segment: `${prismaDocument.id}`,
                },
                {
                  label: "Settings",
                  href: `/documents/${prismaDocument.id}/settings`,
                  segment: "settings",
                },
              ]}
            /> */}

            {/* Stats */}
            <StatsComponent
              documentId={prismaDocument.id}
              numPages={primaryVersion.numPages!}
            />

            {/* Links */}
            <LinksTable
              links={links}
              targetType={"DOCUMENT"}
              primaryVersion={primaryVersion}
            />

            {/* Visitors */}
            <VisitorsTable numPages={primaryVersion.numPages!} />

            <LinkSheet
              isOpen={isLinkSheetOpen}
              linkType="DOCUMENT_LINK"
              setIsOpen={setIsLinkSheetOpen}
              existingLinks={links}
            />
          </>
        ) : (
          <div className="h-screen flex items-center justify-center">
            <LoadingSpinner className="mr-1 h-20 w-20" />
          </div>
        )}
      </main>
    </AppLayout>
  );
}
