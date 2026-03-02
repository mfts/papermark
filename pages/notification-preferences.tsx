import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Image from "next/image";

import { useCallback, useState } from "react";

import {
  BellOffIcon,
  BellRingIcon,
  CalendarClockIcon,
  CheckIcon,
  ClockIcon,
  XIcon,
} from "lucide-react";
import { motion } from "motion/react";

import PapermarkLogo from "@/public/_static/papermark-logo.svg";

import { Button } from "@/components/ui/button";

import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe";
import { ZViewerNotificationPreferencesSchema } from "@/lib/zod/schemas/notifications";

type FrequencyOption = "instant" | "daily" | "weekly" | "disabled";

const FREQUENCY_OPTIONS: {
  value: FrequencyOption;
  label: string;
  description: string;
  icon: typeof BellRingIcon;
}[] = [
  {
    value: "instant",
    label: "Every update",
    description: "Get notified immediately when new documents are added",
    icon: BellRingIcon,
  },
  {
    value: "daily",
    label: "Daily digest",
    description: "Receive a summary of changes once per day at 9 AM UTC",
    icon: ClockIcon,
  },
  {
    value: "weekly",
    label: "Weekly digest",
    description: "Receive a summary of changes every Monday at 9 AM UTC",
    icon: CalendarClockIcon,
  },
  {
    value: "disabled",
    label: "Unsubscribed",
    description: "Stop receiving notifications for this dataroom",
    icon: BellOffIcon,
  },
];

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const token = context.query.token as string | undefined;

  if (!token) {
    return { props: { error: "Token is required", token: "", data: null } };
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload || !payload.dataroomId) {
    return {
      props: { error: "Invalid or expired token", token, data: null },
    };
  }

  if (payload.exp && payload.exp < Date.now() / 1000) {
    return { props: { error: "Token expired", token, data: null } };
  }

  const { viewerId, dataroomId, teamId } = payload;

  try {
    const [viewer, dataroom] = await Promise.all([
      prisma.viewer.findUnique({
        where: { id: viewerId, teamId },
        select: { notificationPreferences: true },
      }),
      prisma.dataroom.findUnique({
        where: { id: dataroomId, teamId },
        select: { name: true },
      }),
    ]);

    if (!viewer) {
      return { props: { error: "Viewer not found", token, data: null } };
    }

    const parsedPreferences = ZViewerNotificationPreferencesSchema.safeParse(
      viewer.notificationPreferences,
    );

    const dataroomPrefs = parsedPreferences.success
      ? parsedPreferences.data.dataroom[dataroomId]
      : undefined;

    let currentFrequency: FrequencyOption;
    if (dataroomPrefs?.enabled === false) {
      currentFrequency = "disabled";
    } else {
      currentFrequency = dataroomPrefs?.frequency ?? "instant";
    }

    return {
      props: {
        error: null,
        token,
        data: {
          dataroomName: dataroom?.name ?? "Unknown Dataroom",
          currentFrequency,
        },
      },
    };
  } catch {
    return {
      props: { error: "Failed to load preferences", token, data: null },
    };
  }
}

export default function NotificationPreferencesPage({
  error: serverError,
  token,
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<FrequencyOption>(
    data?.currentFrequency ?? "instant",
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">(
    serverError ? "error" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState(serverError ?? "");

  const handleSave = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/notification-preferences/dataroom?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frequency: selected }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save preferences");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }, [token, selected]);

  const hasChanged = data ? selected !== data?.currentFrequency : false;

  return (
    <>
      <Head>
        <title>Notification Preferences | Papermark</title>
      </Head>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="px-6 py-5">
          <a
            href="https://www.papermark.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={PapermarkLogo}
              width={119}
              height={32}
              alt="Papermark"
            />
          </a>
        </header>

        <div className="flex flex-1 items-start justify-center px-4 pt-[calc(10vh)]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md"
          >
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <div className="px-6 pb-4 pt-6">
                <h1 className="text-lg font-semibold text-foreground">
                  Notification Preferences
                </h1>
                {data ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how often you want to hear about updates to{" "}
                    <span className="font-medium text-foreground">
                      {data.dataroomName}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="px-6 pb-6">
                {status === "error" && !data ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <XIcon className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Something went wrong
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {errorMsg}
                    </p>
                  </div>
                ) : status === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="py-12 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <CheckIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Preferences saved
                    </p>
                    <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
                      {selected === "disabled"
                        ? "You've unsubscribed from notifications for this dataroom."
                        : `You'll receive ${selected === "instant" ? "instant" : `${selected} digest`} notifications.`}
                    </p>
                    <p className="mt-6 text-xs text-muted-foreground/60">
                      You can close this window now.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {FREQUENCY_OPTIONS.map((option) => {
                        const isSelected = selected === option.value;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelected(option.value);
                              setStatus("idle");
                            }}
                            className={`group flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "border-foreground bg-foreground/[0.03]"
                                : "border-border bg-white hover:bg-muted/50"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 flex-shrink-0 ${
                                isSelected
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-sm font-medium ${
                                  isSelected
                                    ? "text-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {option.label}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                            <div
                              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                                isSelected
                                  ? "border-foreground bg-foreground"
                                  : "border-muted-foreground/40 bg-white"
                              }`}
                            >
                              {isSelected ? (
                                <CheckIcon className="h-2.5 w-2.5 text-white" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {status === "error" && data ? (
                      <p className="mt-3 text-center text-sm text-destructive">
                        {errorMsg}
                      </p>
                    ) : null}

                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanged}
                      loading={saving}
                      className="mt-4 w-full"
                    >
                      Save preferences
                    </Button>
                  </>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground/60">
              Powered by{" "}
              <a
                href="https://www.papermark.com"
                className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Papermark
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
