import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useState } from "react";

export default function Question({
  feedback,
  viewId,
  submittedFeedback,
  setSubmittedFeedback,
}: {
  feedback: { id: string; data: { question: string; type: string } };
  viewId: string;
  submittedFeedback: boolean;
  setSubmittedFeedback: (submittedFeedback: boolean) => void;
}) {
  const [answer, setAnswer] = useState<"yes" | "no" | "">("");

  const handleQuestionSubmit = async (answer: string) => {
    if (answer === "") return;

    const response = await fetch(`/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: answer,
        feedbackId: feedback.id,
        viewId: viewId,
      }),
    });

    if (response.status === 200) {
      setAnswer(answer as "yes" | "no");
      setSubmittedFeedback(true);
    }
  };

  if (submittedFeedback) {
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
          <h1 className="font-display max-w-lg text-3xl font-semibold transition-colors sm:text-4xl text-white">
            Thanks for your feedback!
          </h1>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="z-10 flex flex-col items-center space-y-10 text-center w-full"
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
        className="flex flex-col items-center space-y-10 text-center w-full"
      >
        <h1 className="font-display max-w-xl text-3xl font-semibold transition-colors sm:text-4xl text-white">
          {feedback.data.question}
        </h1>
      </motion.div>
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="grid w-full max-w-sm grid-cols-1 divide-border text-white rounded-md border border-border md:grid-cols-2 md:divide-x md:divide-y-0 divide-y"
      >
        <button
          onClick={() => handleQuestionSubmit("yes")}
          className={cn(
            "flex flex-col items-center justify-center overflow-hidden p-5 space-y-5 transition-colors hover:text-black hover:bg-gray-200 hover:dark:bg-gray-800 md:p-10 min-h-[200px]",
            answer === "yes" ? "bg-gray-200 dark:bg-gray-800" : "",
          )}
        >
          <ThumbsUpIcon
            className="h-auto pointer-events-none w-12 sm:w-12"
            strokeWidth={1}
          />
          <p>Yes</p>
        </button>
        <button
          onClick={() => handleQuestionSubmit("no")}
          className={cn(
            "flex flex-col items-center justify-center overflow-hidden p-5 space-y-5 transition-colors hover:text-black hover:bg-gray-200 hover:dark:bg-gray-800 md:p-10 min-h-[200px]",
            answer === "no" ? "bg-gray-200 dark:bg-gray-800" : "",
          )}
        >
          <ThumbsDownIcon
            className="h-auto pointer-events-none w-12 sm:w-12"
            strokeWidth={1}
          />
          <p>No</p>
        </button>
      </motion.div>
    </motion.div>
  );
}
