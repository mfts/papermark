import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";

import BarList from "@/components/ui/bar-list";

export default function RecentViewsTable() {
  // TODO: Replace with actual data fetching
  const views = [
    {
      id: 1,
      documentName: "Q4 2023 Report.pdf",
      viewerName: "John Doe",
      viewerEmail: "john@example.com",
      duration: "2m 30s",
      viewedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: 2,
      documentName: "Product Roadmap.pdf",
      viewerName: "Jane Smith",
      viewerEmail: "jane@example.com",
      duration: "4m 15s",
      viewedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  ];

  // For the bar visualization, we'll use the duration in seconds
  const getDurationInSeconds = (duration: string) => {
    const [minutes, seconds] = duration.split("m ");
    return parseInt(minutes) * 60 + parseInt(seconds);
  };

  const maxDuration = Math.max(
    ...views.map((view) => getDurationInSeconds(view.duration)),
  );

  const barListData = views.map((view) => ({
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    title: view.documentName,
    subtitle: `${view.viewerName} • ${formatDistanceToNow(view.viewedAt, { addSuffix: true })}`,
    value: getDurationInSeconds(view.duration),
    secondaryValue: view.duration,
  }));

  return (
    <div className="space-y-4">
      <BarList
        data={barListData}
        maxValue={maxDuration}
        barBackground="bg-orange-100 dark:bg-orange-950/50"
      />
    </div>
  );
}
