import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function VideoChartPlaceholder({
  length,
}: {
  length: number | null;
}) {
  const videoLength = length || 51;
  // Generate placeholder data with a nice curve
  const data = Array.from({ length: videoLength }, (_, i) => ({
    start_time: i,
    unique_views:
      i < videoLength / 3 ? 10 : i > videoLength - videoLength / 3 ? 3 : 6,
  }));

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="space-y-1 rounded-md border bg-background p-2 text-sm">
          <p className="text-xs text-muted-foreground">Example Data</p>
          <p className="font-medium">{formatTime(label)}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {payload[0].value} unique viewers
            </p>
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-600" />
              {payload[0].value} playbacks
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="-ml-9 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="start_time"
              tickFormatter={formatTime}
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickFormatter={(value) => Math.floor(value).toString()}
              domain={[0, 1]}
              padding={{ top: 20 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient
                id="uniqueViewsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="unique_views"
              stroke="#9CA3AF"
              strokeWidth={2}
              fill="url(#uniqueViewsGradient)"
              dot={false}
              name="Unique Viewers"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
