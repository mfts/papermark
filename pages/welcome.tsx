import { useRouter } from "next/router";

import { useEffect, useRef } from "react";

import { AnimatePresence } from "framer-motion";
import { ArrowLeft as ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import Dataroom from "@/components/welcome/dataroom";
import DataroomTrial from "@/components/welcome/dataroom-trial";
import DataroomUpload from "@/components/welcome/dataroom-upload";
import Intro from "@/components/welcome/intro";
import Next from "@/components/welcome/next";
import NotionForm from "@/components/welcome/notion-form";
import Select from "@/components/welcome/select";
import Upload from "@/components/welcome/upload";

import { usePlan } from "@/lib/swr/use-billing";

export default function Welcome() {
  const router = useRouter();
  const { plan, trial } = usePlan();
  const toastShownRef = useRef(false);
  const isDataroomUpload = router.query.type === "dataroom-upload";

  const skipButtonText = isDataroomUpload
    ? "Skip to dataroom"
    : "Skip to dashboard";
  const skipButtonPath =
    isDataroomUpload && router.query.dataroomId
      ? `/datarooms/${router.query.dataroomId}`
      : "/documents";

  if (
    router?.query?.type?.includes("dataroom") &&
    plan &&
    !plan.includes("free")
  ) {
    if (!toastShownRef.current) {
      toast.info(`You already have a ${plan} ${trial && "trial "}plan`);
      toastShownRef.current = true;
    }

    router.replace("/documents");
    return <></>;
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col items-center justify-center overflow-x-hidden">
      <div
        className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>
      <AnimatePresence mode="wait">
        {router.query.type ? (
          <>
            <button
              className="group absolute left-2 top-10 z-40 rounded-full p-2 transition-all hover:bg-gray-400 sm:left-10"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-8 w-8 text-gray-500 group-hover:text-gray-800 group-active:scale-90" />
            </button>

            <Button
              variant={"link"}
              onClick={(e) => {
                e.preventDefault();
                router.push(skipButtonPath);
              }}
              className="absolute right-2 top-10 z-40 p-2 text-muted-foreground sm:right-10"
            >
              {skipButtonText}
            </Button>
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
