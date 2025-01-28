import Image from "next/image";
import Script from "next/script";

import React from "react";

interface DropBoxFile {
  id: string;
  name: string;
  bytes: Number;
  isDir: Boolean;
  link: string;
  linkType: string;
  icon: string;
}

export default function DropboxChooser({ clearModelStates }) {
  const dropboxChoserOptions = {
    success: async function (files: DropBoxFile[]) {
      const filePromises = files.map(async (file: DropBoxFile) => {
        const url = file.link;
        const blobData = await downloadFile(url);

        return new File([blobData], file.name, { type: blobData.type });
      });

      const fileList = await Promise.all(filePromises);

      // Create a DataTransfer object and append the files
      const dataTransfer = new DataTransfer();

      fileList.forEach((f) => dataTransfer.items.add(f));

      // Simulate a drop event
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer,
      });

      document
        .getElementById("upload-multi-files-zone")
        ?.dispatchEvent(dropEvent);

      clearModelStates();
    },
    linkType: "direct",
    extensions: [".pdf"],
    multiselect: true,
  };

  async function downloadFile(url: string) {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return blob;
  }

  return (
    <>
      <button
        onClick={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          Dropbox.choose(dropboxChoserOptions);
        }}
        className="rounded-md bg-slate-100 p-2"
      >
        <Image
          src={"/_icons/dropbox.svg"}
          width={24}
          height={24}
          alt="dropbox"
        />
      </button>
      <Script
        async
        defer
        src="https://www.dropbox.com/static/api/2/dropins.js"
        id="dropboxjs"
        data-app-key={process.env.NEXT_PUBLIC_DROPBOX_APP_KEY}
      />
    </>
  );
}
