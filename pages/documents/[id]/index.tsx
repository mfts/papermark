import ErrorPage from "next/error";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";

import { usePlan } from "@/lib/swr/use-billing";
import { useDocument, useDocumentLinks } from "@/lib/swr/use-document";
import useLimits from "@/lib/swr/use-limits";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import DocumentHeader from "@/components/documents/document-header";
import { DocumentPreviewButton } from "@/components/documents/document-preview-button";
import { StatsComponent } from "@/components/documents/stats";
import VideoAnalytics from "@/components/documents/video-analytics";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import VisitorsTable from "@/components/visitors/visitors-table";

export default function DocumentPage() {
  const {
    document: prismaDocument,
    primaryVersion,
    error,
    mutate: mutateDocument,
  } = useDocument();
  const { links } = useDocumentLinks();
  const teamInfo = useTeam();
  const { isTrial } = usePlan();

  const { canAddLinks } = useLimits();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  if (error && error.status === 400) {
    return <ErrorPage statusCode={400} />;
  }

  const AddLinkButton = () => {
    if (!canAddLinks) {
      return (
        <UpgradePlanModal
          clickedPlan={isTrial ? PlanEnum.Business : PlanEnum.Pro}
          trigger={"limit_add_link"}
        >
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
              actions={[
                <DocumentPreviewButton
                  key={"preview"}
                  documentId={prismaDocument.id}
                  primaryVersion={primaryVersion}
                  variant="outline"
                  size="default"
                  showTooltip={false}
                  className="h-8 whitespace-nowrap text-xs lg:h-9 lg:text-sm"
                />,
                <AddLinkButton key={"create-link"} />,
              ]}
            />

            {/* Document Analytics */}
            {primaryVersion.type !== "video" && (
              <StatsComponent
                documentId={prismaDocument.id}
                numPages={primaryVersion.numPages!}
              />
            )}

            {/* Video Analytics */}
            {primaryVersion.type === "video" && (
              <VideoAnalytics
                documentId={prismaDocument.id}
                primaryVersion={primaryVersion}
                teamId={teamInfo?.currentTeam?.id!}
              />
            )}

            {/* Links */}
            <LinksTable
              links={links}
              targetType={"DOCUMENT"}
              primaryVersion={primaryVersion}
              mutateDocument={mutateDocument}
            />

            {/* Visitors */}
            <VisitorsTable
              primaryVersion={primaryVersion}
              isVideo={primaryVersion.type === "video"}
            />

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
