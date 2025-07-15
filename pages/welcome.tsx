import { useRouter } from "next/router";

import { useEffect } from "react";
import { useState } from "react";

import { ArrowLeft as ArrowLeftIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import BrowseTemplates from "@/components/welcome/browse-templates";
import Dataroom from "@/components/welcome/dataroom";
import DataroomChoice from "@/components/welcome/dataroom-choice";
import DataroomCreated from "@/components/welcome/dataroom-created";
import DataroomTrial from "@/components/welcome/dataroom-trial";
import DataroomUpload from "@/components/welcome/dataroom-upload";
import Intro from "@/components/welcome/intro";
import Next from "@/components/welcome/next";
import NotionForm from "@/components/welcome/notion-form";
import Select from "@/components/welcome/select";
import Upload from "@/components/welcome/upload";

export default function Welcome() {
  const router = useRouter();
  const [showSkipButtons, setShowSkipButtons] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButtons(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const isDataroomUpload = router.query.type === "dataroom-upload";

  const skipButtonText = isDataroomUpload
    ? "Skip to dataroom"
    : "Skip to dashboard";
  const skipButtonPath =
    isDataroomUpload && router.query.dataroomId
      ? `/datarooms/${router.query.dataroomId}`
      : "/documents";
  const hideSkipButton = [
    "dataroom-trial",
    "dataroom-choice",
    "browse-templates",
  ].includes(router.query.type as string);
  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col items-center justify-center overflow-x-hidden">
      <AnimatePresence mode="wait">
        {router.query.type ? (
          <>
            <button
              className="group absolute left-2 top-10 z-40 rounded-full p-2 transition-all hover:bg-gray-400 sm:left-10"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-8 w-8 text-gray-500 group-hover:text-gray-800 group-active:scale-90" />
            </button>

            {!hideSkipButton && (
              <Button
                variant={"link"}
                onClick={() => router.push(skipButtonPath)}
                className={cn(
                  "absolute right-2 top-10 z-40 p-2 text-muted-foreground sm:right-10",
                  showSkipButtons ? "block" : "hidden",
                )}
              >
                {skipButtonText}
              </Button>
            )}
          </>
        ) : (
          <Intro key="intro" />
        )}
        {router.query.type === "next" && <Next key="next" />}
        {router.query.type === "select" && <Select key="select" />}
        {router.query.type === "pitchdeck" && <Upload key="pitchdeck" />}
        {router.query.type === "document" && <Upload key="document" />}
        {router.query.type === "sales-document" && (
          <Upload key="sales-document" />
        )}
        {router.query.type === "notion" && <NotionForm key="notion" />}
        {router.query.type === "dataroom" && <Dataroom key="dataroom" />}
        {router.query.type === "dataroom-trial" && (
          <DataroomTrial key="dataroom-trial" />
        )}
        {router.query.type === "dataroom-choice" && (
          <DataroomChoice key="dataroom-choice" />
        )}
        {router.query.type === "browse-templates" && (
          <BrowseTemplates key="browse-templates" />
        )}
        {router.query.type === "dataroom-created" &&
          router.query.dataroomId && (
            <DataroomCreated
              key="dataroom-created"
              dataroomId={router.query.dataroomId as string}
            />
          )}
        {router.query.type === "dataroom-upload" && router.query.dataroomId && (
          <DataroomUpload
            key="dataroom-upload"
            dataroomId={router.query.dataroomId as string}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
