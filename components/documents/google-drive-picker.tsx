"use client";
import { copyToClipboard, getExtension } from "@/lib/utils";
import { put, PutBlobResult } from "@vercel/blob";
import React, { useEffect, useState } from "react";
import useDrivePicker from "react-google-drive-picker";
import { pdfjs } from "react-pdf";
import { usePlausible } from "next-plausible";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function GoogleDrivePicker() {
  const [openPicker, authResponse] = useDrivePicker();
  const plausible = usePlausible();
  const router = useRouter();

  const { access_token } = authResponse || {};

  const [uploading, setUploading] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  useEffect(() => {
    if (currentLinkId) {
      handleContinue(currentLinkId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLinkId]);

  const downloadDriveFile = async (fileId: string, fileName: string) => {
    try {
      setUploading(true);
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const blob = await res.blob();

      //convert blob to file
      const importedFile = new File([blob], fileName, { type: blob.type });

      uploadToVercelBlob({
        fileName: fileName,
        file: importedFile,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleOpenPicker = () => {
    try {
      openPicker({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
        developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
        viewId: "PDFS",
        // token: token, // pass oauth token in case you already have one
        showUploadView: false,
        showUploadFolders: false,
        supportDrives: true,
        multiselect: false,
        // customViews: customViewsArray, // custom view
        callbackFunction: (data) => {
          if (data.action === "cancel") {
            console.log("User clicked cancel/close button");
          }

          if (data?.docs?.[0]) {
            const fileId = data.docs[0].id;
            const fileName = data.docs[0].name;
            downloadDriveFile(fileId, fileName);
          }
        },
      });
    } catch (err) {
      console.log(err);
    }
  };

  const uploadToVercelBlob = async ({
    fileName,
    file,
  }: {
    fileName: string;
    file: File;
  }) => {
    try {
      const newBlob = await put(fileName, file, {
        access: "public",
        handleBlobUploadUrl: "/api/file/browser-upload",
      });

      let response: Response | undefined;
      let numPages: number | undefined;
      // create a document in the database if the document is a pdf
      if (getExtension(newBlob.pathname).includes("pdf")) {
        numPages = await getTotalPages(newBlob.url);
        response = await saveDocumentToDatabase(newBlob, numPages);
      } else {
        response = await saveDocumentToDatabase(newBlob);
      }

      if (response) {
        const document = await response.json();
        const linkId = document.links[0].id;

        // track the event
        plausible("documentUploaded");

        setTimeout(() => {
          setCurrentDocId(document.id);
          setCurrentLinkId(linkId);
          setUploading(false);
        }, 2000);
      }
    } catch (err: any) {
      console.log(err);
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    }
  };

  async function getTotalPages(url: string): Promise<number> {
    const pdf = await pdfjs.getDocument(url).promise;
    return pdf.numPages;
  }

  const saveDocumentToDatabase = async (
    blob: PutBlobResult,
    numPages?: number
  ) => {
    // create a document in the database with the blob url
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: blob.pathname,
        url: blob.url,
        numPages: numPages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  };

  const handleContinue = (id: string) => {
    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`,
      "Link copied to clipboard. Redirecting to document page..."
    );
    setTimeout(() => {
      router.push(`/documents/${currentDocId}`);
      setUploading(false);
    }, 2000);
  };
  return <button onClick={() => handleOpenPicker()}>Open Picker</button>;
}
