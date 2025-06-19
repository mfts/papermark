import ErrorPage from "next/error";
import { useRouter } from "next/router";



import { useEffect, useMemo, useState } from "react";



import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";



import { useDocument, useDocumentLinks } from "@/lib/swr/use-document";
import useLimits from "@/lib/swr/use-limits";
import { compareDocumentCacheData } from "@/lib/utils/compare";



import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import DocumentHeader from "@/components/documents/document-header";
import { StatsComponent } from "@/components/documents/stats";
import VideoAnalytics from "@/components/documents/video-analytics";
import { useDocumentCache } from "@/components/hooks/useDocumentCache";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import VisitorsTable from "@/components/visitors/visitors-table";





function hasDocumentChanged(cachedDoc: any, newData: any): boolean {
  return !compareDocumentCacheData(cachedDoc, newData);
}

export default function DocumentPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getDocument, setDocument, updateDocument } = useDocumentCache();
  const [cachedData, setCachedData] = useState<any>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  const {
    document: prismaDocument,
    primaryVersion,
    error,
    mutate: mutateDocument,
  } = useDocument();
  const { links } = useDocumentLinks();
  const teamInfo = useTeam();

  const { canAddLinks } = useLimits();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadCachedData = async () => {
      if (typeof id === "string" && id) {
        try {
          setIsLoadingCache(true);
          const cached = await getDocument(id);
          setCachedData(cached);

          if (cached?.document?.name) {
            const event = new CustomEvent("openDocumentTab", {
              detail: {
                id,
                title: cached.document.name,
                isTemporary: true,
                data: cached,
              },
            });
            window.dispatchEvent(event);
          }
        } catch (error) {
          console.error("Error loading cached data:", error);
          setCachedData(null);
        } finally {
          setIsLoadingCache(false);
        }
      } else {
        setIsLoadingCache(false);
      }
    };

    loadCachedData();
  }, [id, getDocument]);

  useEffect(() => {
    if (id && prismaDocument && primaryVersion && links) {
      const updateCache = async () => {
        try {
          const cachedDoc = await getDocument(id as string);

          const newData = {
            document: prismaDocument,
            primaryVersion,
            links,
          };

          const shouldUpdate =
            !cachedDoc ||
            cachedDoc.isStale ||
            hasDocumentChanged(cachedDoc, newData);

          if (shouldUpdate) {
            console.log("Cache data changed or stale, updating IndexedDB:", id);

            if (cachedDoc) {
              await updateDocument(id as string, newData);
            } else {
              await setDocument(id as string, newData);
            }

            // Update local cache state
            setCachedData({
              ...newData,
              timestamp: Date.now(),
            });

            const event = new CustomEvent("openDocumentTab", {
              detail: {
                id: prismaDocument.id,
                title: prismaDocument.name || `Document ${prismaDocument.id}`,
                isTemporary: true,
                data: newData,
              },
            });
            window.dispatchEvent(event);
          } else {
            console.log("Cache data unchanged, skipping update:", id);
          }
        } catch (error) {
          console.error("Error updating document cache:", error);
        }
      };

      updateCache();
    }
  }, [
    id,
    prismaDocument,
    primaryVersion,
    links,
    getDocument,
    setDocument,
    updateDocument,
  ]);

  const documentData = useMemo(
    () => cachedData?.document || prismaDocument,
    [cachedData, prismaDocument],
  );
  const versionData = useMemo(
    () => cachedData?.primaryVersion || primaryVersion,
    [cachedData, primaryVersion],
  );
  const linksData = useMemo(
    () => cachedData?.links || links,
    [cachedData, links],
  );

  if (error && error.status === 400) {
    return <ErrorPage statusCode={400} />;
  }

  const AddLinkButton = () => {
    if (!canAddLinks) {
      return (
        <UpgradePlanModal clickedPlan={PlanEnum.Pro} trigger={"limit_add_link"}>
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

  if (
    !documentData &&
    !versionData &&
    (isLoadingCache || (!prismaDocument && !error))
  ) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="mr-1 h-20 w-20" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        {/* Action Header */}
        <DocumentHeader
          primaryVersion={versionData}
          prismaDocument={documentData}
          teamId={teamInfo?.currentTeam?.id!}
          actions={[<AddLinkButton key={"create-link"} />]}
        />

        {/* Document Analytics */}
        {versionData.type !== "video" && (
          <StatsComponent
            documentId={documentData.id}
            numPages={versionData.numPages!}
          />
        )}

        {/* Video Analytics */}
        {versionData.type === "video" && (
          <VideoAnalytics
            documentId={documentData.id}
            primaryVersion={versionData}
            teamId={teamInfo?.currentTeam?.id!}
          />
        )}

        {/* Links */}
        <LinksTable
          links={linksData}
          targetType={"DOCUMENT"}
          primaryVersion={versionData}
          mutateDocument={mutateDocument}
        />

        {/* Visitors */}
        <VisitorsTable
          primaryVersion={versionData}
          isVideo={versionData.type === "video"}
        />

        <LinkSheet
          isOpen={isLinkSheetOpen}
          linkType="DOCUMENT_LINK"
          setIsOpen={setIsLinkSheetOpen}
          existingLinks={linksData}
        />
      </main>
    </AppLayout>
  );
}