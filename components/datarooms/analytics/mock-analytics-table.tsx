import { ChevronRight, Download, Eye, File, Folder } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for analytics preview
const mockAnalyticsData = [
  {
    id: "2",
    name: "Financial Reports",
    type: "folder",
    views: 38,
    downloads: 8,
  },
  { id: "4", name: "Legal Documents", type: "folder", views: 22, downloads: 3 },
  {
    id: "1",
    name: "Executive Summary",
    type: "file",
    views: 45,
    downloads: 12,
  },
  {
    id: "3",
    name: "Market Analysis.pdf",
    type: "file",
    views: 29,
    downloads: 15,
  },
  { id: "5", name: "Product Roadmap", type: "file", views: 18, downloads: 7 },
  { id: "6", name: "Team Structure", type: "file", views: 14, downloads: 2 },
  { id: "7", name: "Marketing Plan", type: "file", views: 14, downloads: 2 },
];

export default function MockAnalyticsTable() {
  return (
    <div className="space-y-6">
      <h3 className="mb-4 text-lg font-medium">Dataroom Analytics</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center">
                  <Eye className="mr-1 h-4 w-4" />
                  <span>Views</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center">
                  <Download className="mr-1 h-4 w-4" />
                  <span>Downloads</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAnalyticsData.map((row, index) => (
              <TableRow
                key={row.id}
                className={cn(
                  "cursor-pointer transition-opacity hover:bg-muted/50",
                  // Fade out the last 2 rows
                  index >= 5 && "opacity-30",
                )}
              >
                <TableCell>
                  {row.type === "folder" && (
                    <Button variant="ghost" className="h-6 w-6 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-foreground">
                    {row.type === "folder" ? (
                      <Folder className="mr-2 h-5 w-5" />
                    ) : (
                      <File className="mr-2 h-5 w-5" />
                    )}
                    <span className="truncate">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{row.views}</TableCell>
                <TableCell className="text-center">{row.downloads}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
