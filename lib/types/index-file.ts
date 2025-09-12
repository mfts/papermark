export interface DataroomIndexEntry {
  hierarchicalIndex: string | null | undefined;
  name: string;
  type: "File" | "Folder" | "Root Folder";
  path: string;
  size?: number;
  pages?: number;
  lastUpdated: Date;
  onlineUrl?: string;
  mimeType?: string;
  createdAt?: Date;
  version?: number;
}

export interface DataroomIndex {
  dataroomId: string;
  dataroomName: string;
  linkId: string;
  generatedAt: Date;
  entries: DataroomIndexEntry[];
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
}

export type IndexFileFormat = "excel" | "csv" | "json";
