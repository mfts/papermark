import { Brand } from "@prisma/client";
import { ExtendedRecordMap } from "notion-types";

import { NotionPage } from "@/components/NotionPage";
import PDFViewer from "@/components/view/PDFViewer";
import PagesViewer from "@/components/view/PagesViewer";

import { LinkWithDocument } from "@/lib/types";

import PagesViewerNew from "./PagesViewerNew";
import { DEFAULT_DOCUMENT_VIEW_TYPE } from "./document-view";

export default function ViewData({
  viewData,
  link,
  notionData,
  brand,
  showPoweredByBanner,
}: {
  viewData: DEFAULT_DOCUMENT_VIEW_TYPE;
  link: LinkWithDocument;
  notionData?: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
  };
  brand?: Partial<Brand> | null;
  showPoweredByBanner?: boolean;
}) {
  const { document } = link;

  return notionData?.recordMap ? (
    <NotionPage
      recordMap={notionData.recordMap}
      // rootPageId={notionData.rootNotionPageId}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={document.id}
      versionNumber={document.versions[0].versionNumber}
      brand={brand}
    />
  ) : viewData.pages ? (
    <PagesViewerNew
      pages={viewData.pages}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={document.id}
      assistantEnabled={document.assistantEnabled}
      allowDownload={link.allowDownload!}
      feedbackEnabled={link.enableFeedback!}
      screenshotProtectionEnabled={link.enableScreenshotProtection!}
      versionNumber={document.versions[0].versionNumber}
      brand={brand}
      showPoweredByBanner={showPoweredByBanner}
      enableQuestion={link.enableQuestion}
      feedback={link.feedback}
      isVertical={document.versions[0].isVertical}
    />
  ) : (
    <PDFViewer
      file={viewData.file}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={document.id}
      name={document.name}
      allowDownload={link.allowDownload}
      assistantEnabled={document.assistantEnabled}
      versionNumber={document.versions[0].versionNumber}
    />
  );
}
