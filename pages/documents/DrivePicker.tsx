"use client";

import Image from "next/image";
import Script from "next/script";

import React, { useCallback, useEffect, useRef } from "react";

export default function DrivePicker({ fileValidations }) {
  const tokenClient = useRef(null);
  const accessToken = useRef(
    window.sessionStorage.getItem("drive_accessToken") ?? null,
  );

  // https://github.com/radix-ui/primitives/issues/1859#issuecomment-1771356816
  useEffect(() => {
    // Disable Radix ui dialog pointer events lockout
    setTimeout(() => (document.body.style.pointerEvents = ""), 0);
  });

  function onApiLoad() {
    gapi.load("picker", () => {});
  }

  function gisLoaded() {
    tokenClient.current = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: "", // defined later
    });
  }

  // Create and render a Google Picker object for selecting from Drive.
  function createPicker() {
    try {
      const showPicker = () => {
        var view = new google.picker.View(
          google.picker.ViewId.DOCS,
        ).setMimeTypes("application/pdf");

        const picker = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken.current)
          .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
          .setCallback(pickerCallback)
          .setAppId(process.env.NEXT_PUBLIC_GOOGLE_APP_ID)
          .build();

        picker.setVisible(true);
      };

      // Request an access token.
      tokenClient.current.callback = async (response) => {
        if (response.error !== undefined) {
          throw response;
        }
        accessToken.current = response.access_token;
        window.sessionStorage.setItem(
          "drive_accessToken",
          response.access_token,
        );

        showPicker();
      };

      if (accessToken.current === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient?.current.requestAccessToken({ prompt: "consent" });
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient?.current.requestAccessToken({ prompt: "" });
      }
    } catch (error) {
      console.log("came here err", error);
    }
  }

  async function downloadFile(fileId: string) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken.current}`,
      },
    });
    const blob = await resp.blob();
    return blob;
  }

  async function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      let doc = data[google.picker.Response.DOCUMENTS][0];

      const blobData = await downloadFile(doc.id);
      const file = new File([blobData], doc.name, { type: blobData.type });

      fileValidations(file);
    }
  }

  return (
    <>
      <p className="mb-2 mt-4 text-sm leading-6 text-gray-500">
        Or import from{" "}
      </p>
      <button
        className="rounded-md bg-slate-100 p-2"
        onClick={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          createPicker();
        }}
      >
        <Image
          src={"/_icons/google-drive.svg"}
          width={24}
          height={24}
          alt="google-drive"
        />
      </button>
      <Script
        async
        defer
        src="https://apis.google.com/js/api.js"
        onReady={onApiLoad}
      />
      <Script
        async
        defer
        src="https://accounts.google.com/gsi/client"
        onReady={gisLoaded}
      />
    </>
  );
}
