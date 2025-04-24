"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

declare const gapi: any; // Declare gapi to avoid TypeScript errors
declare const google: any; // Declare google to avoid TypeScript errors
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  type: "file" | "folder";
  url: string;
  embedUrl: string;
  iconUrl: string;
  parentId: string | null;
  isShared: boolean;
  lastEditedUtc: number | null;
  serviceId: string | null;
  organizationDisplayName: string | null;
}

interface GoogleDrivePickerProps {
  onFileSelect: (files: GoogleDriveFile[]) => void;
  onError: (error: Error) => void;
  accessToken: string;
  isConnected: boolean;
  multiple?: boolean;
  setAddDocumentModalOpen?: (open: boolean) => void;
  fileTypes?: string[];
  isDriveLoading: boolean;
  mutate: () => void;
}

export default function GoogleDrivePicker({
  onFileSelect,
  onError,
  accessToken,
  isConnected,
  multiple = false,
  setAddDocumentModalOpen,
  fileTypes,
  isDriveLoading,
  mutate,
}: GoogleDrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);
  let picker: any;
  useEffect(() => {
    // Load the Google API script
    const loadGoogleApi = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          reject(new Error("Failed to load Google API script"));
        };
        document.body.appendChild(script);
        document.body.style.overflow = "hidden";
      });
    };

    loadGoogleApi().catch((error) => {
      handleError("Failed to load Google API", error);
    });
  }, []);

  const handleSelectFile = () => {
    if (!isConnected) {
      toast.error("Google Drive is not connected");
      return;
    }

    if (!isScriptLoaded) {
      toast.error("Google API is still loading. Please try again in a moment.");
      return;
    }

    setIsLoading(true);
    try {
      gapi.load("picker", {
        callback: onPickerApiLoad,
        onerror: () => handleError("Failed to load Google Picker"),
      });
    } catch (error) {
      handleError("Failed to load Google Picker", error);
    }
  };

  const onPickerApiLoad = () => {
    setIsPickerLoaded(true);
    createPicker();
    setAddDocumentModalOpen?.(false);
  };

  const createPicker = () => {
    const developerKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!developerKey) {
      handleError("Google API Key is missing");
      return;
    }
    try {
      const docsView = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      // Add mime type filter if fileTypes are provided
      if (fileTypes && fileTypes.length > 0) {
        docsView.setMimeTypes(fileTypes.join(","));
      }

      const foldersView = new google.picker.DocsView(
        google.picker.ViewId.FOLDERS,
      )
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      picker = new google.picker.PickerBuilder()
        .addView(docsView)
        .addView(foldersView)
        .setOAuthToken(accessToken)
        .setDeveloperKey(developerKey)
        .setCallback(pickerCallback)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setTitle("Select a file from Google Drive")
        .build();

      picker.setVisible(true);
    } catch (error) {
      handleError("Failed to create Google Picker", error);
    }
  };

  const pickerCallback = async (data: any) => {
    if (!data || !data[google.picker.Response.ACTION]) {
      setIsLoading(false);
      return;
    }

    const action = data[google.picker.Response.ACTION];

    if (action === google.picker.Action.CANCEL) {
      const error = data[google.picker.Response.ERROR];
      if (error) {
        console.error("Google Picker error:", error);
        if (error.code === 403) {
          handleError(
            "Permission denied. Please check your Google Drive permissions and try again.",
          );
        } else {
          handleError(
            `Google Picker error: ${error.message || "Unknown error"}`,
          );
        }
      }
      setIsLoading(false);
      return;
    }

    if (action === google.picker.Action.PICKED) {
      const docs = data[google.picker.Response.DOCUMENTS];
      if (docs && docs.length > 0) {
        onFileSelect(docs);
      } else {
        handleError("No file selected");
      }
    }
    setIsLoading(false);
    document.body.style.overflow = "auto";
  };

  const handleError = (message: string, error?: any) => {
    console.error("handle error drive picker", message, error);
    toast.error(message);
    setIsLoading(false);
    if (onError) onError(error || new Error(message));
    document.body.style.overflow = "auto";
    mutate();
    if (picker) {
      picker.dispose();
    }
  };

  return (
    <Button
      onClick={handleSelectFile}
      disabled={isLoading || !isConnected || !isScriptLoaded}
      className="mt-6 w-full lg:w-1/2"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Google Drive...
        </>
      ) : !isScriptLoaded ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Initializing...
        </>
      ) : (
        `Select ${multiple ? "files" : "file"} from Google Drive`
      )}
    </Button>
  );
}
