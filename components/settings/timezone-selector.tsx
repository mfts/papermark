import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { useTeamSettings } from "@/lib/swr/use-team-settings";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common timezone options with IANA identifiers
const TIMEZONE_OPTIONS = [
  { value: "Etc/UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT)" },
  { value: "America/Toronto", label: "America/Toronto (EST/EDT)" },
  { value: "America/Vancouver", label: "America/Vancouver (PST/PDT)" },
  { value: "America/Mexico_City", label: "America/Mexico City (CST/CDT)" },
  { value: "America/Sao_Paulo", label: "America/São Paulo (BRT)" },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "America/Buenos Aires (ART)",
  },
  { value: "America/Santiago", label: "America/Santiago (CLT/CLST)" },
  { value: "America/Bogota", label: "America/Bogotá (COT)" },
  { value: "America/Lima", label: "America/Lima (PET)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET/CEST)" },
  { value: "Europe/Rome", label: "Europe/Rome (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET/CEST)" },
  { value: "Europe/Zurich", label: "Europe/Zurich (CET/CEST)" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm (CET/CEST)" },
  { value: "Europe/Warsaw", label: "Europe/Warsaw (CET/CEST)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (MSK)" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul (TRT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong Kong (HKT)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (AEST/AEDT)" },
  { value: "Australia/Perth", label: "Australia/Perth (AWST)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST/NZDT)" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu (HST)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
];

export function TimezoneSelector() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { settings: teamSettings } = useTeamSettings(teamId);

  const [selectedTimezone, setSelectedTimezone] = useState<string>("Etc/UTC");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teamSettings?.timezone) {
      setSelectedTimezone(teamSettings.timezone);
    }
  }, [teamSettings?.timezone]);

  const handleSave = async () => {
    if (!teamId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: selectedTimezone }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update timezone");
      }

      await Promise.all([
        mutate(`/api/teams/${teamId}/settings`),
        mutate(`/api/teams/${teamId}`),
      ]);

      toast.success("Timezone updated successfully");
    } catch (error) {
      toast.error((error as Error).message || "Failed to update timezone");
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = teamSettings?.timezone !== selectedTimezone;

  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Analytics Timezone</CardTitle>
        <CardDescription>
          Set the timezone for your team&apos;s analytics. This affects how
          visit data is grouped by day in charts and reports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Select a timezone" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
        <p className="text-sm text-muted-foreground">
          Uses IANA timezone identifiers. Analytics charts will display data
          based on this timezone.
        </p>
        <div className="shrink-0">
          <Button loading={saving} disabled={!hasChanged || saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
