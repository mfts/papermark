import { GetServerSideProps } from "next";
import React, { useState } from "react";
import prisma from "@/lib/prisma";
import EmailForm from "@/components/EmailForm";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import Link from "next/link";
import { useRouter } from "next/router";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentView = ({
  document,
  linkId,
}: {
  document: { id: string; file: string; name: string };
  linkId: string;
}) => {
  const router = useRouter();
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
  if (
    document.file.includes(".png") ||
    document.file.includes(".jpeg") ||
    document.file.includes(".gif") ||
    document.file.includes(".jpg")
  ) {
    return (
      <div className="h-screen bg-gray-900">
        <img className="w-full h-full" src={document.file} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col items-center space-y-4">
      <div className="text-center">
        <div className="text-white text-2xl mt-10">{document.name}</div>
        <p className="text-gray-400">
          This file cannot be viewed in the browser.
        </p>
      </div>
      <Link
        href={document.file}
        className="rounded px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        Download file
      </Link>
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
