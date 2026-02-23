"use client";

import {
  type CSSProperties,
  type ElementType,
  type JSX,
  memo,
  useMemo,
} from "react";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type TextShimmerProps = {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  hoverOnly?: boolean;
};

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  hoverOnly = false,
}: TextShimmerProps) => {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements,
  );

  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread],
  );

  const animationProps = hoverOnly
    ? {
        initial: { backgroundPosition: "100% center" },
        whileHover: { backgroundPosition: "0% center" },
      }
    : {
        initial: { backgroundPosition: "100% center" },
        animate: { backgroundPosition: "0% center" },
      };

  const transitionProps = hoverOnly
    ? {
        duration,
        ease: "linear" as const,
      }
    : {
        repeat: Number.POSITIVE_INFINITY,
        duration,
        ease: "linear" as const,
      };

  return (
    <MotionComponent
      {...animationProps}
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className,
      )}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage:
            "var(--bg), linear-gradient(var(--muted-foreground), var(--muted-foreground))",
        } as CSSProperties
      }
      transition={transitionProps}
    >
      {children}
    </MotionComponent>
  );
};

export const Shimmer = memo(ShimmerComponent);
