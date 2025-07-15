import { useRouter } from "next/router";

import { motion } from "motion/react";

import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import useDataroomTemplates from "@/lib/swr/use-dataroom-templates";

import { TemplateCard } from "@/components/datarooms/template-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseTemplates() {
  const { templates, loading: templatesLoading } = useDataroomTemplates();
  const router = useRouter();

  const handleTemplateCreated = (dataroomId: string) => {
    router.push(`/welcome?type=dataroom-created&dataroomId=${dataroomId}`);
  };

  return (
    <motion.div
      className="z-10 mx-5 flex w-full flex-col items-center space-y-10 text-center sm:mx-auto"
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
        className="flex w-full flex-col items-center space-y-10 text-center"
      >
        <p className="text-2xl font-bold tracking-tighter text-foreground">
          Papermark
        </p>
        <h1 className="font-display max-w-lg text-3xl font-semibold transition-colors sm:text-4xl">
          Choose a Template
        </h1>
        <p className="max-w-md text-muted-foreground">
          Select one of our professionally designed templates to get a head
          start on your dataroom.
        </p>
      </motion.div>

      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="w-full max-w-4xl"
      >
        {templatesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card">
                <div className="flex flex-col space-y-1.5 p-6">
                  <Skeleton className="aspect-[3/1] w-full rounded-md" />
                  <Skeleton className="h-6 w-3/4 pt-2" />
                </div>
                <div className="p-6 pt-0">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          templates &&
          templates.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onTemplateCreated={handleTemplateCreated}
                />
              ))}
            </div>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
