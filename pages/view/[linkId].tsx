import React, { useState } from "react";
import EmailForm from "@/components/EmailForm";
import { getExtension } from "@/lib/utils";
import { useLink } from "@/lib/swr/use-link";
import ErrorPage from "next/error";
import PDFViewer from "@/components/PDFViewer";

export default function DocumentView() {
  const { link, error } = useLink();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (!link) {
    return <div>Loading...</div>;
  }
  const { document } = link;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/views", {
      method: "POST",
      body: JSON.stringify({ linkId: link.id, email, documentId: document.id }),
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

  // get the file extension
  const extension = getExtension(document.file);

  if (
    extension.includes(".docx") ||
    extension.includes(".pptx") ||
    extension.includes(".xlsx") ||
    extension.includes(".xls") ||
    extension.includes(".doc") ||
    extension.includes(".ppt")
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
    extension.includes(".png") ||
    extension.includes(".jpeg") ||
    extension.includes(".gif") ||
    extension.includes(".jpg")
  ) {
    return (
      <div className="h-screen bg-gray-900">
        <img className="w-full h-full" src={document.file} />
      </div>
    );
  }
  return (
    <div className="bg-gray-950">
      <PDFViewer file={document.file} />
    </div>
  );
}
