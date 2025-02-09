import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BarList from "@/components/ui/bar-list";

export default function ViewersTable() {
  // TODO: Replace with actual data fetching
  const viewers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      viewCount: 15,
      avgDuration: "3m 45s",
      lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      viewCount: 8,
      avgDuration: "2m 30s",
      lastActive: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
  ];

  const maxViews = Math.max(...viewers.map((viewer) => viewer.viewCount));

  const barListData = viewers.map((viewer) => ({
    icon: (
      <Avatar className="h-6 w-6">
        <AvatarImage src={`https://avatar.vercel.sh/${viewer.email}`} />
        <AvatarFallback>{viewer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    ),
    title: viewer.name,
    subtitle: viewer.email,
    value: viewer.viewCount,
    secondaryValue: viewer.avgDuration,
  }));

  return (
    <div className="space-y-4">
      <BarList
        data={barListData}
        maxValue={maxViews}
        barBackground="bg-green-100 dark:bg-green-950/50"
      />
    </div>
  );
}
