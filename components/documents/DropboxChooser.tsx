import Image from "next/image";
import Script from "next/script";

import React from "react";

export default function DropboxChooser({ fileValidations }) {
  const dropboxChoserOptions = {
    success: async function (files: any) {
      const url = files[0].link;
      const blobData = await downloadFile(url);

      const file = new File([blobData], files[0].name, { type: blobData.type });

      fileValidations(file);
    },
    linkType: "direct",
    extensions: [".pdf"],
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
