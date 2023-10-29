import { DEFAULT_DOCUMENT_VIEW_TYPE } from "../document-view";
import { LinkWithDocument } from "@/lib/types";
import PagesViewer from "@/components/PagesViewer";
import PDFViewer from "@/components/PDFViewer";

export default function ViewData({
  viewData,
  link
} : {
  viewData : DEFAULT_DOCUMENT_VIEW_TYPE,
  link : LinkWithDocument, 
}) {
  return (viewData.pages ? (
    <PagesViewer
      pages={viewData.pages}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={link.document.id}
    />
    ) : (
    <PDFViewer
      file={viewData.file}
      viewId={viewData.viewId}
      linkId={link.id}
      documentId={link.document.id}
      name={link.document.name}
      allowDownload={link.allowDownload}
    />
    )
  )
}