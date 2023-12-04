import { DEFAULT_DOCUMENT_VIEW_TYPE } from "./document-view";
import { LinkWithDocument } from "@/lib/types";
import PagesViewer from "@/components/view/PagesViewer";
import PDFViewer from "@/components/view/PDFViewer";
import { NotionPage } from "../../NotionPage";
import { ExtendedRecordMap } from "notion-types";
import { Document } from "@prisma/client";

export default function ViewData({
  viewData,
  link,
  document,
  notionData,
}: {
  viewData: DEFAULT_DOCUMENT_VIEW_TYPE;
  link: LinkWithDocument;
  document: Document;
  notionData?: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
  };
}) {
  return notionData && notionData.recordMap ? (
    <NotionPage
      recordMap={notionData.recordMap}
      // rootPageId={notionData.rootNotionPageId}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={document.id}
      versionNumber={document.versions[0].versionNumber}
    />
  ) : viewData.pages ? (
    <PagesViewer
      pages={viewData.pages}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={document.id}
      assistantEnabled={document.assistantEnabled}
      versionNumber={document.versions[0].versionNumber}
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
      versionNumber={document.versions.versionNumber}
    />
  );
}
