import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  BriefcaseIcon,
  BuildingIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HomeIcon,
  LineChartIcon,
  RocketIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { z } from "zod";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";

const TEMPLATES = [
  {
    id: "startup-fundraising",
    name: "Startup Fundraising",
    icon: RocketIcon,
  },
  {
    id: "series-a-plus",
    name: "Series A+ Fundraising",
    icon: TrendingUpIcon,
  },
  {
    id: "raising-first-fund",
    name: "Raising a Fund",
    icon: LineChartIcon,
  },
  {
    id: "ma-acquisition",
    name: "M&A / Acquisition",
    icon: BriefcaseIcon,
  },
  {
    id: "sales-dataroom",
    name: "Sales Data Room",
    icon: ShoppingCartIcon,
  },
  {
    id: "real-estate-transaction",
    name: "Real Estate",
    icon: HomeIcon,
  },
  {
    id: "fund-management",
    name: "Fund Management",
    icon: BuildingIcon,
  },
  {
    id: "portfolio-management",
    name: "Portfolio Management",
    icon: FolderKanbanIcon,
  },
  {
    id: "project-management",
    name: "Project Management",
    icon: FileTextIcon,
  },
];

export default function DataroomTemplates({
  dataroomId,
}: {
  dataroomId: string;
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidDataroomId, setIsValidDataroomId] = useState(false);

  // Validate dataroomId on mount
  useEffect(() => {
    try {
      z.string().cuid().parse(dataroomId);
      setIsValidDataroomId(true);
    } catch (error) {
      console.error("Invalid dataroom ID:", error);
      toast.error("Invalid dataroom ID. Redirecting...");
      router.push("/documents");
    }
  }, [dataroomId, router]);

  const handleTemplateSelect = async (templateType: string) => {
    // Validate dataroomId before making API call
    try {
      const dataroomIdParsed = z.string().cuid().parse(dataroomId);

      setSelectedTemplate(templateType);
      setLoading(true);

      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomIdParsed}/apply-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: templateType,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        toast.error(message);
        setLoading(false);
        setSelectedTemplate(null);
        return;
      }

      analytics.capture("Dataroom Template Applied", {
        dataroomId: dataroomIdParsed,
        templateType,
      });

      toast.success("Template applied successfully! 🎉");
      router.push(`/datarooms/${dataroomIdParsed}/documents`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Invalid dataroom ID:", error);
        toast.error("Invalid dataroom ID.");
      } else {
        console.error("Error applying template:", error);
        toast.error("Error applying template. Please try again.");
      }
      setLoading(false);
      setSelectedTemplate(null);
    }
  };

  // Don't render until dataroomId is validated
  if (!isValidDataroomId) {
    return null;
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
        <p className="text-2xl font-bold tracking-tighter text-foreground">
          Papermark
        </p>
        <h1 className="font-display max-w-md text-3xl font-semibold transition-colors sm:text-4xl">
          Select a template to get started
        </h1>
      </motion.div>

      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="grid w-full grid-cols-3 divide-x divide-y divide-border overflow-hidden rounded-md border border-border text-foreground"
      >
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate === template.id;
          const isLoading = loading && isSelected;

          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              disabled={loading}
              className="relative flex min-h-[200px] flex-col items-center justify-center space-y-5 overflow-hidden p-5 transition-colors hover:bg-gray-200 hover:dark:bg-gray-800 md:p-10"
            >
              <Icon className="pointer-events-none h-auto w-12 sm:w-12" />
              <p>{template.name}</p>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#fb7a00]" />
                </div>
              )}
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
