import { useState } from "react";

import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { motion } from "motion/react";

import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { determineTextColor } from "@/lib/utils/determine-text-color";

export default function Question({
  feedback,
  viewId,
  submittedFeedback,
  setSubmittedFeedback,
  isPreview,
  accentColor,
}: {
  feedback: { id: string; data: { question: string; type: string } };
  viewId?: string;
  submittedFeedback: boolean;
  setSubmittedFeedback: (submittedFeedback: boolean) => void;
  isPreview?: boolean;
  accentColor?: string | null;
}) {
  const [answer, setAnswer] = useState<"yes" | "no" | "">("");

  const handleQuestionSubmit = async (answer: string) => {
    if (answer === "") return;

    // If in preview mode, skip recording the answer
    if (isPreview) {
      setAnswer(answer as "yes" | "no");
      setSubmittedFeedback(true);
      return;
    }

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
        className="mx-5 flex h-full flex-col items-center justify-center space-y-10 text-center sm:mx-auto"
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
          <h1
            className="font-display max-w-lg text-3xl font-semibold transition-colors sm:text-4xl"
            style={{
              color: accentColor ? determineTextColor(accentColor) : "white",
            }}
          >
            Thanks for your feedback!
          </h1>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center space-y-10 text-center"
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
        <h1
          className="font-display max-w-xl text-3xl font-semibold transition-colors sm:text-4xl"
          style={{
            color: accentColor ? determineTextColor(accentColor) : "white",
          }}
        >
          {feedback.data.question}
        </h1>
      </motion.div>
      <motion.div
        variants={STAGGER_CHILD_VARIANTS}
        className="grid w-full max-w-sm grid-cols-1 divide-y rounded-md border border-border md:grid-cols-2 md:divide-x md:divide-y-0"
        style={{
          color: accentColor ? determineTextColor(accentColor) : "white",
          borderColor: accentColor
            ? determineTextColor(accentColor)
            : "hsl(var(--border))",
        }}
      >
        <button
          onClick={() => handleQuestionSubmit("yes")}
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center space-y-5 overflow-hidden p-5 transition-colors md:p-10",
            determineTextColor(accentColor) === "black"
              ? "hover:bg-gray-800 hover:text-gray-200"
              : "hover:bg-gray-200 hover:text-gray-800",
            answer === "yes"
              ? determineTextColor(accentColor) === "black"
                ? "bg-gray-800 text-gray-200"
                : "bg-gray-200 text-gray-800"
              : "",
          )}
        >
          <ThumbsUpIcon
            className="pointer-events-none h-auto w-12 sm:w-12"
            strokeWidth={1}
          />
          <p>Yes</p>
        </button>
        <button
          onClick={() => handleQuestionSubmit("no")}
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center space-y-5 overflow-hidden p-5 transition-colors md:p-10",
            determineTextColor(accentColor) === "black"
              ? "hover:bg-gray-800 hover:text-gray-200"
              : "hover:bg-gray-200 hover:text-gray-800",
            answer === "no"
              ? determineTextColor(accentColor) === "black"
                ? "bg-gray-800 text-gray-200"
                : "bg-gray-200 text-gray-800"
              : "",
          )}
        >
          <ThumbsDownIcon
            className="pointer-events-none h-auto w-12 sm:w-12"
            strokeWidth={1}
          />
          <p>No</p>
        </button>
      </motion.div>
    </motion.div>
  );
}
