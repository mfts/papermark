import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkType } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";

import {
  DEFAULT_LINK_PROPS,
  DEFAULT_LINK_TYPE,
} from "@/components/links/link-sheet";
import { Button } from "@/components/ui/button";
import { LinkOptionContainer } from "@/components/welcome/containers/link-option-container";

export default function DataroomCreated({
  dataroomId,
}: {
  dataroomId: string;
}) {
  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const router = useRouter();
  const [showLinkOptions, setShowLinkOptions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(LinkType.DATAROOM_LINK),
  );

  const createLink = async () => {
    if (!teamInfo?.currentTeam?.id) {
      toast.error("Team information not available");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: dataroomId,
          linkType: "DATAROOM_LINK",
          teamId: teamInfo.currentTeam.id,
        }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        toast.error(message);
        return;
      }

      const link = await response.json();
      setLinkId(link.id);

      analytics.capture("Dataroom Link Created", {
        linkId: link.id,
        dataroomId: dataroomId,
        teamId: teamInfo.currentTeam.id,
        source: "template_onboarding",
      });

      setShowLinkOptions(true);
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error("Error creating link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showLinkOptions && linkId) {
    return (
      <LinkOptionContainer
        currentLinkId={linkId}
        linkData={linkData}
        setLinkData={setLinkData}
        currentDataroomId={dataroomId}
      />
    );
  }

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
        <div className="space-y-4">
          <h1 className="font-display max-w-lg text-3xl font-semibold transition-colors sm:text-4xl">
            Dataroom created successfully!
          </h1>
          <p className="max-w-md text-muted-foreground">
            Your dataroom has been created from the template. Now create a
            shareable link to start sharing your documents.
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="w-full max-w-md space-y-4"
      >
        <Button
          className="w-full"
          onClick={createLink}
          loading={loading}
          disabled={loading}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Create Shareable Link
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/datarooms/${dataroomId}`)}
        >
          Go to Dataroom
        </Button>
      </motion.div>

      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="text-center text-sm text-muted-foreground"
      >
        You can create additional links and customize settings later
      </motion.div>
    </motion.div>
  );
}
