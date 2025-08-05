import { Clock, Globe, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { getTimezoneOptions } from "@/lib/slack/timezone-utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { BadgeTooltip } from "../ui/tooltip";

interface SlackFrequencySettingsProps {
  teamId: string;
  integration: {
    id: string;
    frequency: "instant" | "daily" | "weekly";
    timezone: string;
    dailyTime?: string;
    weeklyDay?: string;
    enabledChannels: Record<string, any>;
  };
  onUpdate: (updatedIntegration: any) => void;
}

const timezones = getTimezoneOptions();

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const weekDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const frequencyOptions = [
  {
    value: "instant",
    label: "Instantly",
    tooltip:
      "Send notifications immediately when events occur (document views, downloads, reactions, etc.)",
  },
  {
    value: "daily",
    label: "Daily",
    tooltip:
      "Send a summary digest of all events once per day at your chosen time",
  },
  {
    value: "weekly",
    label: "Weekly",
    tooltip:
      "Send a summary digest of all events once per week on your chosen day and time",
  },
];

export default function SlackFrequencySettings({
  teamId,
  integration,
  onUpdate,
}: SlackFrequencySettingsProps) {
  const updateIntegration = async (
    updates: Partial<typeof integration>,
    successMessage?: string,
  ) => {
    const response = await fetch(`/api/teams/${teamId}/slack`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...integration, ...updates }),
    });

    if (response.ok) {
      const updatedIntegration = await response.json();
      onUpdate(updatedIntegration);
      if (successMessage) {
        toast.success(successMessage);
      }
    } else {
      throw new Error("Failed to update settings");
    }
  };

  const updateDailyTime = (dailyTime: string) => {
    toast.promise(updateIntegration({ dailyTime }), {
      loading: "Updating digest time...",
      success: `Digest time updated to ${dailyTime}`,
      error: "Failed to update digest time. Please try again.",
    });
  };

  const updateTimezone = (timezone: string) => {
    toast.promise(updateIntegration({ timezone }), {
      loading: "Updating timezone...",
      success: `Timezone updated to ${timezones.find((tz) => tz.value === timezone)?.label || timezone}`,
      error: "Failed to update timezone. Please try again.",
    });
  };

  const updateWeeklyDay = (weeklyDay: string) => {
    const dayLabel =
      weekDays.find((day) => day.value === weeklyDay)?.label || weeklyDay;
    toast.promise(updateIntegration({ weeklyDay }), {
      loading: "Updating weekly schedule...",
      success: `Weekly digest scheduled for ${dayLabel}`,
      error: "Failed to update weekly schedule. Please try again.",
    });
  };

  const updateFrequency = async (frequency: "instant" | "daily" | "weekly") => {
    const updatePromise = async () => {
      await updateIntegration({ frequency });

      if (frequency === "daily" || frequency === "weekly") {
        const updatedChannels = { ...integration.enabledChannels };
        let channelsUpdated = false;

        Object.keys(updatedChannels).forEach((channelId) => {
          if (
            updatedChannels[channelId] &&
            !updatedChannels[channelId].notificationTypes.includes("digest")
          ) {
            updatedChannels[channelId] = {
              ...updatedChannels[channelId],
              notificationTypes: [
                ...updatedChannels[channelId].notificationTypes,
                "digest",
              ],
            };
            channelsUpdated = true;
          }
        });

        if (channelsUpdated) {
          await updateIntegration({ enabledChannels: updatedChannels });
        }
      }
    };

    toast.promise(updatePromise(), {
      loading: `Updating notification frequency to ${frequency}...`,
      success: (data) => {
        const messages = [`Frequency updated to ${frequency}`];

        if (frequency === "daily" || frequency === "weekly") {
          messages.push(
            "Digest summaries automatically enabled for all selected channels",
          );
        }

        return messages.join(". ");
      },
      error: "Failed to update notification frequency. Please try again.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Notification Frequency
        </CardTitle>
        <CardDescription>
          Choose how often you want to receive notifications in your Slack
          channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={integration.frequency}
          onValueChange={(value) =>
            updateFrequency(value as "instant" | "daily" | "weekly")
          }
        >
          <div className="flex flex-row space-x-6">
            {frequencyOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex items-center gap-2">
                  <Label htmlFor={option.value} className="text-sm font-medium">
                    {option.label}
                  </Label>
                  <BadgeTooltip
                    content={option.tooltip}
                    key={`${option.value}_tooltip`}
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </BadgeTooltip>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Time and Timezone Settings */}
        {(integration.frequency === "daily" ||
          integration.frequency === "weekly") && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Digest Schedule</Label>
                <p className="text-sm text-muted-foreground">
                  Choose when to receive your {integration.frequency} digest
                  notifications
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  💡 Digest summaries will be automatically enabled for all
                  selected channels
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Time Selection */}
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor="time"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Clock className="h-4 w-4" />
                    Time
                  </Label>
                  <Select
                    value={integration.dailyTime || "10:00"}
                    onValueChange={(dailyTime) => updateDailyTime(dailyTime)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone Selection */}
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor="timezone"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Select
                    value={integration.timezone || "UTC"}
                    onValueChange={(timezone) => updateTimezone(timezone)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekly Day Selection (only for weekly) */}
                {integration.frequency === "weekly" && (
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="weeklyDay" className="text-sm font-medium">
                      Day of Week
                    </Label>
                    <Select
                      value={integration.weeklyDay || "monday"}
                      onValueChange={(weeklyDay) => updateWeeklyDay(weeklyDay)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Preview:</strong> You&apos;ll receive{" "}
                  {integration.frequency} digest notifications{" "}
                  {integration.frequency === "daily" &&
                    `at ${integration.dailyTime || "10:00"} ${timezones.find((tz) => tz.value === integration.timezone)?.label.split(" ")[0] || "UTC"}`}
                  {integration.frequency === "weekly" &&
                    `every ${weekDays.find((day) => day.value === (integration.weeklyDay || "monday"))?.label} at ${integration.dailyTime || "10:00"} ${timezones.find((tz) => tz.value === integration.timezone)?.label.split(" ")[0] || "UTC"}`}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
