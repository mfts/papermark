"use client";

import React, { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, FileText, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { Loader } from "../loader";

interface ChatLoadingIndicatorProps {
  isVisible: boolean;
  className?: string;
}

const loadingSteps = [
  {
    icon: Search,
    text: "Analyzing query...",
    // description: "Understanding your question",
  },
  {
    icon: FileText,
    text: "Searching documents...",
    // description: "Finding relevant content",
  },
  {
    icon: Brain,
    text: "Processing results...",
    // description: "Analyzing and ranking",
  },
  {
    icon: Sparkles,
    text: "Generating response...",
    // description: "Creating your answer",
  },
];

export function ChatLoadingIndicator({
  isVisible,
  className,
}: ChatLoadingIndicatorProps) {
  const startTimeRef = useRef<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      setElapsedTime(
        Math.floor((Date.now() - (startTimeRef.current ?? 0)) / 1000),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      startTimeRef.current = null;
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentStepData = loadingSteps[currentStep];
  const IconComponent = currentStepData.icon;

  // Format elapsed time as mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-visible py-2",
        className,
      )}
    >
      <div className="relative">
        <Loader className="h-5 w-5 animate-spin text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {currentStepData.text}
              </span>
            </div>
            {/* <p className="ml-6 text-xs text-muted-foreground">
              {currentStepData.description}
            </p> */}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="ml-auto flex flex-col items-end gap-2">
        <div className="flex gap-1">
          {loadingSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-300",
                index <= currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>
      {elapsedTime > 0 && (
        <div className="absolute -bottom-6 -right-3 z-[9999] flex items-center gap-1 rounded-full border-2 border-background bg-primary px-1 py-0.5 font-mono text-xs font-semibold text-primary-foreground ring-2 ring-primary/20">
          <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
      )}
    </div>
  );
}
