import { useMemo } from "react";

import { format, subDays, subHours } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TimeRange } from "./time-range-select";

interface DashboardViewsChartProps {
  timeRange: TimeRange;
  data?: {
    date: string;
    views: number;
  }[];
}

export default function DashboardViewsChart({
  timeRange,
  data = [],
}: DashboardViewsChartProps) {
  // Format the data for display
  const formattedData = useMemo(() => {
    // Generate all possible time slots
    const now = new Date();
    const slots: { date: Date; views: number }[] = [];

    if (timeRange === "24h") {
      // Generate 24 hourly slots
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        date.setMinutes(0, 0, 0); // Reset minutes, seconds, milliseconds
        slots.push({ date, views: 0 });
      }
    } else {
      // Generate daily slots for 7d or 30d
      const days = timeRange === "7d" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0); // Reset hours, minutes, seconds, milliseconds
        slots.push({ date, views: 0 });
      }
    }

    // Fill in actual data points
    if (data) {
      data.forEach((point) => {
        const pointDate = new Date(point.date);
        const slotIndex = slots.findIndex((slot) => {
          if (timeRange === "24h") {
            return slot.date.getHours() === pointDate.getHours();
          } else {
            return slot.date.toDateString() === pointDate.toDateString();
          }
        });
        if (slotIndex !== -1) {
          slots[slotIndex].views = point.views;
        }
      });
    }

    // Format for display
    return slots.map((slot) => ({
      date: slot.date,
      name: format(slot.date, timeRange === "24h" ? "h:mm aa" : "EEE, MMM d"),
      views: slot.views,
    }));
  }, [data, timeRange]);

  // Calculate tick values based on time range
  const ticks = useMemo(() => {
    if (!formattedData.length) return [];

    if (timeRange === "24h") {
      // Show current hour and every 5th hour working backwards
      const tickIndices = [];
      for (let i = formattedData.length - 1; i >= 0; i -= 5) {
        tickIndices.unshift(i);
      }
      return tickIndices.map((i) => formattedData[i].name);
    } else if (timeRange === "7d") {
      // Show all days
      return formattedData.map((d) => d.name);
    } else if (timeRange === "30d") {
      // Show current day and every 5th day working backwards
      const tickIndices = [];
      for (let i = formattedData.length - 1; i >= 0; i -= 5) {
        tickIndices.unshift(i);
      }
      return tickIndices.map((i) => formattedData[i].name);
    }
    return formattedData.map((d) => d.name);
  }, [timeRange, formattedData]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          barSize={timeRange === "24h" ? 8 : timeRange === "7d" ? 24 : 12}
        >
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            ticks={ticks}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Time
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {timeRange === "24h"
                            ? format(data.date, "h:mm a")
                            : format(data.date, "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Views
                        </span>
                        <span className="font-bold">{data.views}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="views"
            fill="rgb(16 185 129)"
            stroke="rgb(16 185 129)"
            strokeWidth={1}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
