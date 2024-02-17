import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { LinkWithViews, LinkWithDocument } from "@/lib/types";
import PagesViewer from "./preview-pages";
import { toast } from "sonner";
import LoadingSpinner from "../ui/loading-spinner";
import { useDocumentLinks } from "@/lib/swr/use-document";

type DEFAULT_DOCUMENT_VIEW_TYPE = {
  file: string | null;
  pages: { file: string; pageNumber: string }[] | null;
};
type PREVIEW_VIEW_TYPE = {
  linkId: string;
  documentVersionId: string;
  hasPages: boolean;
};

const DocumentPreview = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    file: null,
    pages: null,
  });
  const { links } = useDocumentLinks();

  const fetchDocumentData = async () => {
    try {
      const res = await fetch(`/api/links/${(links as LinkWithViews[])[0].id}`);

      if (!res.ok) return;

      const { link } = (await res.json()) as {
        link: LinkWithDocument;
      };

      if (!link || !link.document) return;

      const { type } = link.document.versions[0];

      if (type === "notion") return;

      handleSubmission({
        linkId: link.id,
        documentVersionId: link.document.versions[0].id,
        hasPages: link.document.versions[0].hasPages,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmission = async ({
    linkId,
    documentVersionId,
    hasPages,
  }: PREVIEW_VIEW_TYPE): Promise<void> => {
    const response = await fetch("/api/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ linkId, documentVersionId, hasPages }),
    });

    if (response.ok) {
      const data = await response.json();
      const { file, pages } = data as DEFAULT_DOCUMENT_VIEW_TYPE;
      setViewData({ file, pages });
    } else {
      const { message } = await response.json();
      toast.error(message);
    }
  };

  useEffect(() => {
    isOpen && fetchDocumentData();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="!pb-2">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
        </DialogHeader>

        <section className="w-full">
          {viewData.pages ? (
            <PagesViewer pages={viewData.pages} />
          ) : (
            <div className="flex items-center justify-center mx-auto relative h-[80vh] w-full">
              <LoadingSpinner className="h-20 w-20 text-foreground" />
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;
