import Link from "next/link";
import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { usePlan } from "@/lib/swr/use-billing";

export default function UpgradePlanContainer() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const teamInfo = useTeam();
  const { plan, isFree, isDataroomsPlus } = usePlan();

  const manageSubscription = async () => {
    if (!teamInfo?.currentTeam?.id) {
      return;
    }

    const teamId = teamInfo?.currentTeam?.id;

    setLoading(true);

    try {
      fetch(`/api/teams/${teamId}/billing/manage`, {
        method: "POST",
      })
        .then(async (res) => {
          const url = await res.json();
          router.push(url);
        })
        .catch((err) => {
          throw err;
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const ButtonList = () => {
    if (isFree) {
      return (
        <Link href="/settings/upgrade">
          <Button>Upgrade Plan</Button>
        </Link>
      );
    } else {
      return (
        <Button onClick={manageSubscription} loading={loading}>
          Manage Subscription
        </Button>
      );
    }
  };

  return (
    <div className="rounded-lg">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            You are currently on the{" "}
            <span className="mx-0.5 rounded-full bg-background px-2.5 py-1 text-xs font-bold tracking-normal text-foreground ring-1 ring-gray-800 dark:ring-gray-400">
              {isDataroomsPlus
                ? "Datarooms+"
                : plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>{" "}
            plan.{" "}
            <Link
              href="/settings/upgrade"
              className="text-sm underline underline-offset-4 hover:text-foreground"
            >
              See all plans
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <div className="shrink-0">{ButtonList()}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
