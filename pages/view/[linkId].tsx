import { GetServerSideProps } from "next";
import React, { useState } from "react";
import prisma from "@/lib/prisma";
import EmailForm from "@/components/EmailForm";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentView = ({
  document,
  linkId,
}: {
  document: { id: string; file: string; name: string };
  linkId: string;
}) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [numPages, setNumPages] = useState<Number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/views", {
      method: "POST",
      body: JSON.stringify({ linkId, email, documentId: document.id }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      setSubmitted(true);
    } else {
      // Handle error
    }
  };

  if (!submitted) {
    return <EmailForm onSubmitHandler={handleSubmit} setEmail={setEmail} />;
  }

  if (document.file.includes(".pdf")) {
    return (
      <div>
        <Document file={document.file} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer={false}
            />
          ))}
        </Document>
      </div>
    );
  }
  if (
    document.file.includes(".docx") ||
    document.file.includes(".pptx") ||
    document.file.includes(".doc") ||
    document.file.includes(".ppt")
  ) {
    return (
      <div className="h-screen bg-gray-900">
        <iframe
          className="w-full h-full"
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${document.file}`}
        ></iframe>
      </div>
    );
  }
  return (
    <div className="h-screen bg-gray-900">
      <img className="w-full h-full" src={document.file} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const linkId = params?.linkId as string;

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { document: true },
  });

  if (!link || !link.document) {
    return {
      notFound: true,
    };
  }

  const document = link.document;

  return {
    props: {
      document: {
        id: document.id,
        file: document.file,
        name: document.name,
      },
      linkId,
    },
  };
};

export default DocumentView;
