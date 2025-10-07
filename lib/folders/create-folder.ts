import { mutate } from "swr";

import { SYSTEM_FILES } from "../constants";

export function isSystemFile(name: string): boolean {
  return (
    SYSTEM_FILES.includes(name.toLowerCase()) ||
    name.toLowerCase().startsWith(".")
  );
}

interface CreateFolderResponse {
  path: string;
  parentFolderPath?: string;
  name: string;
}

export async function createFolderInDataroom({
  teamId,
  dataroomId,
  name,
  path,
}: {
  teamId: string;
  dataroomId: string;
  name: string;
  path?: string;
}): Promise<CreateFolderResponse> {
  const response = await fetch(
    `/api/teams/${teamId}/datarooms/${dataroomId}/folders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        path,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create folder in dataroom");
  }

  return response.json();
}

export async function createFolderInMainDocs({
  teamId,
  name,
  path,
}: {
  teamId: string;
  name: string;
  path?: string;
}): Promise<CreateFolderResponse> {
  const response = await fetch(`/api/teams/${teamId}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      path,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Failed to create folder in all documents",
    );
  }

  return response.json();
}

export function determineFolderPaths({
  currentDataroomPath,
  currentMainDocsPath,
  isFirstLevelFolder,
}: {
  currentDataroomPath?: string;
  currentMainDocsPath?: string;
  isFirstLevelFolder: boolean;
}): {
  parentDataroomPath?: string;
  parentMainDocsPath?: string;
} {
  return {
    parentDataroomPath: currentDataroomPath,
    parentMainDocsPath: isFirstLevelFolder ? undefined : currentMainDocsPath,
  };
}

export async function createFolderInBoth({
  teamId,
  dataroomId,
  name,
  parentMainDocsPath,
  parentDataroomPath,
  setRejectedFiles,
  analytics,
}: {
  teamId: string;
  dataroomId: string;
  name: string;
  parentMainDocsPath?: string;
  parentDataroomPath?: string;
  setRejectedFiles: (files: { fileName: string; message: string }[]) => void;
  analytics: any;
}): Promise<{ dataroomPath: string; mainDocsPath?: string }> {
  try {
    // Only create folder in dataroom, not in main documents
    // This prevents polluting the All Documents section with dataroom folder structures
    const dataroomResponse = await createFolderInDataroom({
      teamId,
      dataroomId,
      name,
      path: parentDataroomPath,
    });

    // Track analytics
    analytics.capture("Folder Added in dataroom", {
      folderName: name,
      dataroomTargetParent: parentDataroomPath,
    });

    // Mutate dataroom folders
    mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/folders?root=true`);
    mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/folders`);
    mutate(
      `/api/teams/${teamId}/datarooms/${dataroomId}/folders/${dataroomResponse.path}`,
    );

    return {
      dataroomPath: dataroomResponse.path,
      mainDocsPath: undefined,
    };
  } catch (error) {
    console.error(
      "An error occurred while creating the folder in dataroom: ",
      error,
    );
    setRejectedFiles([
      {
        fileName: name,
        message:
          error instanceof Error ? error.message : "Failed to create folder",
      },
    ]);
    throw error;
  }
}
