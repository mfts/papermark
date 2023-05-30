import { GetServerSideProps } from "next";
import React, { useState } from "react";
import prisma from "@/lib/prisma";
import EmailForm from "@/components/EmailForm";
import Link from "next/link";

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

  if (
    document.file.includes(".docx") ||
    document.file.includes(".pptx") ||
    document.file.includes(".xlsx") ||
    document.file.includes(".xls") ||
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
    <div className="h-screen bg-gray-900">
      <iframe
        className="w-full h-full"
        src={`https://docs.google.com/viewer?url=${document.file}&embedded=true`}
      ></iframe>
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
