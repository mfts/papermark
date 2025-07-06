import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { LayoutTemplateIcon, Plus } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";

export default function DataroomChoice() {
  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const createFromScratch = async () => {
    if (!teamInfo?.currentTeam?.id) {
      toast.error("Team information not available");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/datarooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Dataroom #1",
          }),
        },
      );

      if (!response.ok) {
        const { message, info } = await response.json();
        toast.error(message);
        if (info === "trial_limit_reached") {
          window.location.replace("/datarooms");
        }
        return;
      }
      const {
        dataroom: { id: dataroomId },
      } = await response.json();

      analytics.capture("Dataroom Created from Scratch", {
        dataroomId,
        teamId: teamInfo.currentTeam.id,
      });

      toast.success("Dataroom created successfully!");
      await mutate(`/api/teams/${teamInfo.currentTeam.id}/datarooms`);

      // Navigate to upload screen for the new dataroom
      router.push(`/welcome?type=dataroom-upload&dataroomId=${dataroomId}`);
    } catch (error) {
      console.error("Error creating dataroom:", error);
      toast.error("Error creating dataroom. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="z-10 mx-5 flex flex-col items-center space-y-10 text-center sm:mx-auto"
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: {
          opacity: 1,
          scale: 1,
          transition: {
            staggerChildren: 0.2,
          },
        },
      }}
      initial="hidden"
      animate="show"
      exit="hidden"
      transition={{ duration: 0.3, type: "spring" }}
    >
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="flex flex-col items-center space-y-10 text-center"
      >
        <p className="text-2xl font-bold tracking-tighter text-foreground">
          Papermark
        </p>
        <h1 className="font-display max-w-lg text-3xl font-semibold transition-colors sm:text-4xl">
          How would you like to create your dataroom?
        </h1>
        <p className="max-w-md text-muted-foreground">
          Choose to start from scratch or use one of our pre-built templates to
          get started quickly.
        </p>
      </motion.div>

      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="grid w-full grid-cols-1 divide-y divide-border rounded-md border border-border text-foreground md:grid-cols-2 md:divide-x"
      >
        <button
          onClick={createFromScratch}
          disabled={loading}
          className="flex min-h-[200px] flex-col items-center justify-center space-y-5 overflow-hidden p-5 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 hover:dark:bg-gray-800 md:p-10"
        >
          <Plus className="pointer-events-none h-auto w-12 sm:w-12" />
          <p>Create from Scratch</p>
        </button>
        <button
          onClick={() => router.push("/welcome?type=browse-templates")}
          className="flex min-h-[200px] flex-col items-center justify-center space-y-5 overflow-hidden p-5 transition-colors hover:bg-gray-200 hover:dark:bg-gray-800 md:p-10"
        >
          <LayoutTemplateIcon className="pointer-events-none h-auto w-12 sm:w-12" />
          <p>Use Template</p>
        </button>
      </motion.div>

      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="text-center text-sm text-muted-foreground"
      >
        You can always modify your dataroom structure later
      </motion.div>
    </motion.div>
  );
}
