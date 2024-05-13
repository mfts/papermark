"use client";

import { useEffect, useState } from "react";

import { getStatus } from "@openstatus/react";

import { cn } from "@/lib/utils";

export function StatusWidget() {
  const [status, setStatus] = useState("operational");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getStatus("papermark");

        if (response) {
          setStatus(response.status);
        }
      } catch {}
    }

    fetchData();
  }, []);

  const getStatusLevel = (level: string) => {
    return {
      operational: {
        label: "All Systems Operational",
        color: "bg-green-500",
        color2: "bg-green-400",
      },
      degraded_performance: {
        label: "Degraded Performance",
        color: "bg-yellow-500",
        color2: "bg-yellow-400",
      },
      partial_outage: {
        label: "Partial Outage",
        color: "bg-yellow-500",
        color2: "bg-yellow-400",
      },
      major_outage: {
        label: "Major Outage",
        color: "bg-red-500",
        color2: "bg-red-400",
      },
      unknown: {
        label: "Unknown",
        color: "bg-gray-500",
        color2: "bg-gray-400",
      },
      incident: {
        label: "Incident",
        color: "bg-yellow-500",
        color2: "bg-yellow-400",
      },
      under_maintenance: {
        label: "Under Maintenance",
        color: "bg-gray-500",
        color2: "bg-gray-400",
      },
    }[level];
  };

  const level = getStatusLevel(status);

  if (!level) {
    return null;
  }

  return (
    <a
      className="flex w-full items-center justify-between space-x-2 rounded-md border border-border px-3 py-1"
      href="https://papermark.openstatus.dev"
      target="_blank"
      rel="noreferrer"
    >
      <div>
        <p className="text-sm">{level.label}</p>
      </div>

      <span className="relative ml-auto flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            level.color2,
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            level.color,
          )}
        />
      </span>
    </a>
  );
}
