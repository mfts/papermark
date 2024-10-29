import ErrorPage from "next/error";

import { useState } from "react";

import { useTeam } from "@/context/team-context";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import DocumentHeader from "@/components/documents/document-header";
import { StatsComponent } from "@/components/documents/stats";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { NavMenu } from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import VisitorsTable from "@/components/visitors/visitors-table";

import { useDocument, useDocumentLinks } from "@/lib/swr/use-document";
import useLimits from "@/lib/swr/use-limits";

export default function DocumentPage() {
  const { document: prismaDocument, primaryVersion, error } = useDocument();
  const { links } = useDocumentLinks();
  const teamInfo = useTeam();

  const { canAddLinks } = useLimits();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (error && error.status === 400) {
    return <ErrorPage statusCode={400} />;
  }

  const AddLinkButton = () => {
    if (!canAddLinks) {
      return (
        <UpgradePlanModal clickedPlan="Pro" trigger={"limit_add_link"}>
          <Button className="flex h-8 whitespace-nowrap text-xs lg:h-9 lg:text-sm">
            Upgrade to Create Link
          </Button>
        </UpgradePlanModal>
      );
    } else {
      return (
        <Button
          className="flex h-8 whitespace-nowrap text-xs lg:h-9 lg:text-sm"
          onClick={() => setIsLinkSheetOpen(true)}
        >
          Create Link
        </Button>
      );
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        {prismaDocument && primaryVersion ? (
          <>
            {/* Action Header */}
            <DocumentHeader
              primaryVersion={primaryVersion}
              prismaDocument={prismaDocument}
              teamId={teamInfo?.currentTeam?.id!}
              actions={[<AddLinkButton key={"create-link"} />]}
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
            <VisitorsTable />

            <LinkSheet
              isOpen={isLinkSheetOpen}
              linkType="DOCUMENT_LINK"
              setIsOpen={setIsLinkSheetOpen}
              existingLinks={links}
            />
          </>
        ) : (
          <div className="flex h-screen items-center justify-center">
            <LoadingSpinner className="mr-1 h-20 w-20" />
          </div>
        )}
      </main>
    </AppLayout>
  );
}
