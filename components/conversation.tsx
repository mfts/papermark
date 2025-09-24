"use client";

import { memo, useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

import { cn } from "@/lib/utils";

export type ConversationProps = {
  className?: string;
  children: React.ReactNode;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
};

export const Conversation = memo(
  forwardRef<HTMLDivElement, ConversationProps>(
    ({ className, children, onScroll }, ref) => {
      const outerDiv = useRef<HTMLDivElement>(null);
      const innerDiv = useRef<HTMLDivElement>(null);
      const prevInnerDivHeight = useRef<number>(0);
      const [showMessages, setShowMessages] = useState(false);

      useImperativeHandle(ref, () => outerDiv.current!, []);

    const getScrollDimensions = useCallback(() => {
      if (!outerDiv.current || !innerDiv.current) {
        return { outerDivHeight: 0, innerDivHeight: 0, outerDivScrollTop: 0 };
      }
      const outerDivHeight = outerDiv.current.clientHeight;
      const innerDivHeight = innerDiv.current.clientHeight + 28;
      const outerDivScrollTop = outerDiv.current.scrollTop;
      return { outerDivHeight, innerDivHeight, outerDivScrollTop };
    }, []);

    useEffect(() => {
      if (!outerDiv.current || !innerDiv.current) return;

      const { innerDivHeight, outerDivHeight, outerDivScrollTop } =
        getScrollDimensions();

      if (
        !prevInnerDivHeight.current ||
        Math.ceil(outerDivScrollTop) ===
          prevInnerDivHeight.current - outerDivHeight
      ) {
        outerDiv.current.scrollTo({
          top: innerDivHeight - outerDivHeight,
          left: 0,
          behavior: prevInnerDivHeight.current ? "smooth" : "auto",
        });
        setShowMessages(true);
      }

      prevInnerDivHeight.current = innerDivHeight;
    }, [children, getScrollDimensions]);

    const handleScrollEvent = useCallback(() => {
      if (onScroll) {
        const syntheticEvent = {
          currentTarget: outerDiv.current,
        } as React.UIEvent<HTMLDivElement>;
        onScroll(syntheticEvent);
      }
    }, [onScroll]);

    useEffect(() => {
      const outerDivCurrent = outerDiv.current;
      if (!outerDivCurrent) return;

      outerDivCurrent.addEventListener("scroll", handleScrollEvent);
      return () => {
        outerDivCurrent.removeEventListener("scroll", handleScrollEvent);
      };
    }, [handleScrollEvent]);

      return (
        <div className={cn("relative flex-1", className)}>
          <div 
            ref={outerDiv}
            className="h-full overflow-y-auto" 
            role="log"
          >
            <div
              ref={innerDiv}
              className={cn(
                "relative transition-all duration-300 ease-in-out",
                showMessages ? "opacity-100" : "opacity-0",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      );
    }
  ),
);

Conversation.displayName = "Conversation";

export type ConversationContentProps = {
  className?: string;
  children: React.ReactNode;
};

export const ConversationContent = memo(
  ({ className, children }: ConversationContentProps) => (
    <div className={cn("p-2", className)}>{children}</div>
  ),
);

ConversationContent.displayName = "ConversationContent";

export const ConversationScrollButton = () => null;
