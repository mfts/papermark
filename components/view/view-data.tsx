import dynamic from "next/dynamic";

import { Brand } from "@prisma/client";
import { ExtendedRecordMap } from "notion-types";

import { NotionPage } from "@/components/NotionPage";
import PDFViewer from "@/components/view/PDFViewer";
import PagesViewerNew from "@/components/view/PagesViewerNew";
import { DEFAULT_DOCUMENT_VIEW_TYPE } from "@/components/view/document-view";

import { LinkWithDocument, NotionTheme, WatermarkConfig } from "@/lib/types";

import AdvancedExcelViewer from "./viewer/advanced-excel-viewer";
import DownloadOnlyViewer from "./viewer/download-only-viewer";
import ImageViewer from "./viewer/image-viewer";

const ExcelViewer = dynamic(
  () => import("@/components/view/viewer/excel-viewer"),
  { ssr: false },
);

export default function ViewData({
  viewData,
  link,
  notionData,
  brand,
  showPoweredByBanner,
  showAccountCreationSlide,
  useAdvancedExcelViewer,
  viewerEmail,
}: {
  viewData: DEFAULT_DOCUMENT_VIEW_TYPE;
  link: LinkWithDocument;
  notionData?: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
    theme: NotionTheme | null;
  };
  brand?: Partial<Brand> | null;
  showPoweredByBanner?: boolean;
  showAccountCreationSlide?: boolean;
  useAdvancedExcelViewer?: boolean;
  viewerEmail?: string;
}) {
  const { document } = link;

  return notionData?.recordMap ? (
    <NotionPage
      recordMap={notionData.recordMap}
      // rootPageId={notionData.rootNotionPageId}
      viewId={viewData.viewId}
      isPreview={viewData.isPreview}
      linkId={link.id}
      documentId={document.id}
      versionNumber={document.versions[0].versionNumber}
      brand={brand}
      theme={notionData.theme}
      screenshotProtectionEnabled={link.enableScreenshotProtection!}
    />
  ) : document.downloadOnly ? (
    <DownloadOnlyViewer
      file={viewData.file!}
      linkId={link.id}
      viewId={viewData.viewId}
      documentId={document.id}
      allowDownload={true}
      versionNumber={document.versions[0].versionNumber}
      brand={brand}
      documentName={document.name}
      isPreview={viewData.isPreview}
    />
  ) : viewData.fileType === "sheet" && viewData.sheetData ? (
    <ExcelViewer
      linkId={link.id}
      viewId={viewData.viewId}
      isPreview={viewData.isPreview}
      documentId={document.id}
      documentName={document.name}
      versionNumber={document.versions[0].versionNumber}
      sheetData={viewData.sheetData}
      brand={brand}
      allowDownload={link.allowDownload!}
      screenshotProtectionEnabled={link.enableScreenshotProtection!}
    />
  ) : viewData.fileType === "sheet" && useAdvancedExcelViewer ? (
    <AdvancedExcelViewer
      linkId={link.id}
      viewId={viewData.viewId}
      isPreview={viewData.isPreview}
      documentId={document.id}
      documentName={document.name}
      versionNumber={document.versions[0].versionNumber}
      file={viewData.file!}
      allowDownload={link.allowDownload!}
      brand={brand}
    />
  ) : viewData.fileType === "image" ? (
    <ImageViewer
      file={viewData.file!}
      linkId={link.id}
      documentId={document.id}
      viewId={viewData.viewId}
      assistantEnabled={document.assistantEnabled}
      allowDownload={link.allowDownload!}
      feedbackEnabled={link.enableFeedback!}
      screenshotProtectionEnabled={link.enableScreenshotProtection!}
      screenShieldPercentage={link.screenShieldPercentage}
      versionNumber={document.versions[0].versionNumber}
      brand={brand}
      showPoweredByBanner={showPoweredByBanner}
      showAccountCreationSlide={showAccountCreationSlide}
      enableQuestion={link.enableQuestion}
      feedback={link.feedback}
      isVertical={document.versions[0].isVertical}
      viewerEmail={viewerEmail}
      watermarkConfig={
        link.enableWatermark ? (link.watermarkConfig as WatermarkConfig) : null
      }
      ipAddress={viewData.ipAddress}
      linkName={link.name ?? `Link #${link.id.slice(-5)}`}
      isPreview={viewData.isPreview}
    />
  ) : viewData.pages ? (
    <PagesViewerNew
      pages={viewData.pages}
      viewId={viewData.viewId}
      isPreview={viewData.isPreview}
      linkId={link.id}
      documentId={document.id}
      assistantEnabled={document.assistantEnabled}
      allowDownload={link.allowDownload!}
      feedbackEnabled={link.enableFeedback!}
      screenshotProtectionEnabled={link.enableScreenshotProtection!}
      screenShieldPercentage={link.screenShieldPercentage}
      versionNumber={document.versions[0].versionNumber}
      brand={brand}
      showPoweredByBanner={showPoweredByBanner}
      showAccountCreationSlide={showAccountCreationSlide}
      enableQuestion={link.enableQuestion}
      feedback={link.feedback}
      isVertical={document.versions[0].isVertical}
      viewerEmail={viewerEmail}
      watermarkConfig={
        link.enableWatermark ? (link.watermarkConfig as WatermarkConfig) : null
      }
      ipAddress={viewData.ipAddress}
      linkName={link.name ?? `Link #${link.id.slice(-5)}`}
    />
  ) : (
    <PDFViewer
      file={viewData.file}
      viewId={viewData.viewId}
      isPreview={viewData.isPreview}
      linkId={link.id}
      documentId={document.id}
      name={document.name}
      allowDownload={link.allowDownload}
      assistantEnabled={document.assistantEnabled}
      versionNumber={document.versions[0].versionNumber}
    />
  );
}
