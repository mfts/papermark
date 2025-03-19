import { useRouter } from "next/router";

import { File as DocumentIcon, ServerIcon } from "lucide-react";
import { motion } from "motion/react";

import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";

import { DataroomTrialModal } from "../datarooms/dataroom-trial-modal";
import { Button } from "../ui/button";

export default function Dataroom() {
  const router = useRouter();
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
          Data rooms are here!
        </h1>
      </motion.div>
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="mx-auto mt-24 w-full"
      >
        <video
          width="100%"
          id="video1"
          style={{ borderRadius: "6px" }}
          aria-hidden="true"
          playsInline
          autoPlay
          muted
          loop
          controls
        >
          <source
            src="https://assets.agrowy.com/upload/file_A4qNV68jr3MAUayMNi3WmY-Data-Room-demo-2.mp4"
            type="video/mp4"
          />
        </video>
      </motion.div>
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="mt-10 flex flex-col items-center space-y-4 text-center"
      >
        <Button
          className="px-10 text-base font-medium"
          onClick={() =>
            router.push({
              pathname: "/welcome",
              query: {
                type: "dataroom-trial",
              },
            })
          }
        >
          Get a data room trial
        </Button>
        <span className="text-xs text-muted-foreground">
          Data rooms are available on our `Business` and `Data Rooms` plan.{" "}
          <br />
          You receive a 7-day trial.
        </span>
      </motion.div>
    </motion.div>
  );
}
