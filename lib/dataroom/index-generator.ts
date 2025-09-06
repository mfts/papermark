import { DataroomFolder, Document, DocumentVersion } from "@prisma/client";
import ExcelJS from "exceljs";

import { LinkWithDataroom } from "../types";
import {
  DataroomIndex,
  DataroomIndexEntry,
  IndexFileFormat,
} from "../types/index-file";

interface GenerateIndexOptions {
  format?: IndexFileFormat;
  baseUrl?: string;
  showHierarchicalIndex?: boolean;
}

interface DataroomDocumentWithVersion {
  id: string;
  folderId: string | null;
  orderIndex: number | null;
  updatedAt: Date;
  createdAt: Date;
  hierarchicalIndex: string | null;
  document: {
    id: string;
    name: string;
    versions: {
      id: string;
      versionNumber: number;
      type: string;
      hasPages: boolean;
      file: string;
      fileSize: number;
      isVertical: boolean;
      numPages: number;
      updatedAt: Date;
    }[];
  };
}

const formatBytes = (bytes: number): number => {
  if (bytes === 0) return 0;
  // Convert bytes to MB by dividing by 1024^2 (1MB = 1024 * 1024 bytes)
  const mb = bytes / (1024 * 1024);
  // Round to 2 decimal places
  return parseFloat(mb.toFixed(2));
};

export async function generateDataroomIndex(
  link: LinkWithDataroom,
  options: GenerateIndexOptions = {},
): Promise<{ data: Buffer; filename: string; mimeType: string }> {
  const { format = "excel", baseUrl, showHierarchicalIndex = false } = options;

  // Generate the index data structure
  const indexData: DataroomIndex = {
    dataroomId: link.dataroom.id,
    dataroomName: link.dataroom.name,
    linkId: link.id,
    generatedAt: new Date(),
    entries: [],
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
  };

  // Helper function to process folders recursively
  function processFolder(
    folder: DataroomFolder,
    parentPath: string = "",
  ): DataroomIndexEntry[] {
    const entries: DataroomIndexEntry[] = [];
    const currentPath = parentPath
      ? `${parentPath}/${folder.name}`
      : `/${folder.name}`;

    // Add folder entry
    entries.push({
      hierarchicalIndex: showHierarchicalIndex
        ? folder.hierarchicalIndex
        : undefined,
      name: folder.name,
      type: "Folder",
      path: currentPath.split("/").slice(0, -1).join("/") || "/",
      lastUpdated: folder.updatedAt || new Date(),
      createdAt: folder.createdAt || new Date(),
    });
    indexData.totalFolders++;

    // Process documents in the folder
    const documents = (
      link.dataroom?.documents as DataroomDocumentWithVersion[]
    ).filter((doc) => doc.folderId === folder.id);

    for (const doc of documents) {
      const latestVersion =
        doc.document.versions[doc.document.versions.length - 1];
      const entry: DataroomIndexEntry = {
        hierarchicalIndex: showHierarchicalIndex
          ? doc.hierarchicalIndex
          : undefined,
        name: doc.document.name,
        type: "File",
        path: `${currentPath}/`,
        lastUpdated: latestVersion?.updatedAt || new Date(),
        createdAt: doc.createdAt,
        pages: latestVersion?.numPages ?? 0,
        size: formatBytes(latestVersion?.fileSize ?? 0),
        onlineUrl: `${baseUrl}/d/${doc.id}`,
        mimeType: latestVersion?.type,
        version: latestVersion?.versionNumber,
      };
      entries.push(entry);
      indexData.totalFiles++;
      indexData.totalSize += latestVersion?.fileSize ?? 0;
    }

    // Process subfolders recursively
    const childFolders = link.dataroom.folders.filter(
      (f: DataroomFolder) => f.parentId === folder.id,
    );
    for (const childFolder of childFolders) {
      entries.push(...processFolder(childFolder, currentPath));
    }

    return entries;
  }

  // Process root level items
  const rootFolders = link.dataroom.folders.filter(
    (f: DataroomFolder) => !f.parentId,
  );
  const rootDocuments = (
    link.dataroom.documents as DataroomDocumentWithVersion[]
  ).filter((d) => !d.folderId);

  // Add root dataroom entry
  indexData.entries.push({
    hierarchicalIndex: showHierarchicalIndex ? "0" : undefined,
    name: link.dataroom.name,
    type: "Root Folder",
    path: "",
    lastUpdated: link.dataroom.lastUpdatedAt,
    createdAt: link.dataroom.createdAt,
    onlineUrl: `${baseUrl}`,
  });

  // Process root folders
  for (const folder of rootFolders) {
    indexData.entries.push(...processFolder(folder));
  }

  // Process root documents
  for (const doc of rootDocuments) {
    const latestVersion =
      doc.document.versions[doc.document.versions.length - 1];
    indexData.entries.push({
      hierarchicalIndex: showHierarchicalIndex
        ? doc.hierarchicalIndex
        : undefined,
      name: doc.document.name,
      type: "File",
      path: "/",
      lastUpdated:
        doc.updatedAt > latestVersion?.updatedAt
          ? doc.updatedAt
          : latestVersion?.updatedAt || new Date(),
      createdAt: doc.createdAt,
      pages: latestVersion?.numPages ?? 0,
      size: formatBytes(latestVersion?.fileSize ?? 0),
      onlineUrl: `${baseUrl}/d/${doc.id}`,
      mimeType: latestVersion?.type || "unknown",
      version: latestVersion?.versionNumber,
    });
    indexData.totalFiles++;
    indexData.totalSize += latestVersion?.fileSize ?? 0;
  }

  // Generate the filename
  const date = indexData.generatedAt
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    .replace(",", ""); // Remove the comma that might appear between day and year
  const safeFilename = `${link.dataroom.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_Index_${date.replace(/[^a-zA-Z0-9]/g, "_")}`;

  // Generate the output file based on the requested format
  switch (format) {
    case "excel": {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Dataroom Index");

      // Define columns with their configuration
      const columns = [
        ...(showHierarchicalIndex
          ? [{ header: "Index", key: "hierarchicalIndex", width: 10 }]
          : []),
        { header: "Name", key: "name", width: 30 },
        { header: "Type", key: "type", width: 10 },
        { header: "Path", key: "path", width: 40 },
        { header: "Version", key: "version", width: 8 },
        { header: "Pages", key: "pages", width: 8 },
        { header: "Size", key: "size", width: 8 },
        { header: "Online Link", key: "onlineUrl", width: 50 },
        { header: "MIME Type", key: "mimeType", width: 20 },
        { header: "Added At", key: "createdAt", width: 20 },
        { header: "Last Updated At", key: "lastUpdated", width: 20 },
      ];

      // Set column widths and properties
      worksheet.columns = columns;

      // Find the index of the onlineUrl column (1-based for ExcelJS)
      const onlineUrlColumnIndex =
        columns.findIndex((col) => col.key === "onlineUrl") + 1;

      // Validate that the column was found
      if (onlineUrlColumnIndex === 0) {
        throw new Error("onlineUrl column not found in column definitions");
      }

      // Add title rows
      worksheet.spliceRows(
        1,
        0,
        [`Data Room: ${indexData.dataroomName}`],
        [`Index File generated: ${indexData.generatedAt.toLocaleString()}`],
        [], // Empty row for spacing
      );

      // Style the title rows
      const titleStyle = {
        fill: {
          type: "pattern" as const,
          pattern: "solid" as const,
          fgColor: { argb: "4F81BD" },
        },
        font: {
          color: { argb: "FFFFFF" },
          bold: true,
          size: 14,
        },
        alignment: { horizontal: "left" as const },
      };

      worksheet.getRow(1).eachCell((cell) => {
        cell.style = titleStyle;
      });
      worksheet.getRow(2).eachCell((cell) => {
        cell.style = titleStyle;
      });

      // Merge cells for title rows
      worksheet.mergeCells("A1:H1");
      worksheet.mergeCells("A2:H2");

      // Style the header row
      const headerRow = worksheet.getRow(4);
      headerRow.font = { size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "DCE6F1" },
      };
      headerRow.alignment = { horizontal: "center" };
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows
      indexData.entries.forEach((entry, index) => {
        const row = worksheet.addRow([
          ...(showHierarchicalIndex ? [entry.hierarchicalIndex] : []),
          entry.name,
          entry.type,
          entry.path,
          entry.version,
          entry.pages,
          entry.size,
          entry.onlineUrl,
          entry.mimeType,
          entry.createdAt?.toLocaleDateString(),
          entry.lastUpdated.toLocaleDateString(),
        ]);

        // Style based on entry type
        if (entry.type === "Folder") {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F2F2F2" },
          };
        }

        // Add hyperlink to Online URL
        if (entry.onlineUrl) {
          const cell = row.getCell(onlineUrlColumnIndex); // dynamically found online link column
          cell.value = {
            text: entry.onlineUrl,
            hyperlink: entry.onlineUrl,
            tooltip: `Open ${entry.name} in browser`,
          };
          cell.font = {
            color: { argb: "0563C1" },
            underline: true,
          };
        }
      });

      // Add summary worksheet
      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.columns = [
        { header: "Property", key: "property", width: 20 },
        { header: "Value", key: "value", width: 30 },
      ];

      const summaryData = [
        ["Dataroom Name", indexData.dataroomName],
        ["Generated At", indexData.generatedAt.toLocaleDateString()],
        ["Total Files", indexData.totalFiles],
        ["Total Folders", indexData.totalFolders],
        ["Total Size (MB)", formatBytes(indexData.totalSize)],
      ];

      summaryData.forEach(([property, value]) => {
        const row = summarySheet.addRow([property, value]);
        row.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "DCE6F1" },
        };
        row.getCell(1).font = { bold: true };
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        data: Buffer.from(buffer),
        filename: `${safeFilename}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }

    case "csv": {
      const csvRows = [
        [
          ...(showHierarchicalIndex ? ["Index"] : []),
          "Name",
          "Type",
          "Path",
          "Version",
          "Pages",
          "Size",
          "Online Link",
          "MIME Type",
          "Added At",
          "Last Updated At",
        ],
        ...indexData.entries.map((entry) => [
          ...(showHierarchicalIndex ? [entry.hierarchicalIndex] : []),
          entry.name,
          entry.type,
          entry.path,
          entry.version,
          entry.pages,
          entry.size,
          entry.onlineUrl,
          entry.mimeType,
          entry.createdAt?.toISOString(),
          entry.lastUpdated.toISOString(),
        ]),
      ];
      const csvContent = csvRows.map((row) => row.join(",")).join("\n");

      return {
        data: Buffer.from(csvContent),
        filename: `${safeFilename}.csv`,
        mimeType: "text/csv",
      };
    }

    case "json":
    default: {
      return {
        data: Buffer.from(JSON.stringify(indexData, null, 2)),
        filename: `${safeFilename}.json`,
        mimeType: "application/json",
      };
    }
  }
}
