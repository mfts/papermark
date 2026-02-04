"use client";

import { useEffect, useState } from "react";

import { InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IntroductionModalProps {
  dataroom: {
    id?: string;
    name?: string;
    introductionEnabled?: boolean;
    introductionContent?: any;
  };
  viewerId?: string;
}

// Render TipTap JSON content
function renderContent(content: any): React.ReactNode {
  if (!content || !content.content) return null;

  return content.content.map((node: any, index: number) => {
    if (node.type === "heading") {
      const level = node.attrs?.level || 1;
      const text = node.content?.[0]?.text || "";
      if (level === 1) {
        return (
          <h1
            key={index}
            className="mb-3 mt-4 text-xl font-bold text-gray-900 first:mt-0 dark:text-gray-100"
          >
            {text}
          </h1>
        );
      }
      return (
        <h2
          key={index}
          className="mb-2 mt-4 text-base font-semibold text-gray-800 first:mt-0 dark:text-gray-200"
        >
          {text}
        </h2>
      );
    } else if (node.type === "paragraph") {
      return (
        <p key={index} className="mb-3 text-sm leading-relaxed text-gray-700">
          {node.content?.map((textNode: any, textIndex: number) => {
            if (textNode.type === "text") {
              let text: React.ReactNode = textNode.text;
              if (textNode.marks) {
                textNode.marks.forEach((mark: any) => {
                  if (mark.type === "bold") {
                    text = (
                      <strong key={textIndex} className="font-semibold">
                        {text}
                      </strong>
                    );
                  } else if (mark.type === "italic") {
                    text = (
                      <em key={textIndex} className="italic">
                        {text}
                      </em>
                    );
                  }
                });
              }
              return text;
            } else if (textNode.type === "image") {
              return (
                <img
                  key={textIndex}
                  src={textNode.attrs?.src}
                  alt={textNode.attrs?.alt || ""}
                  className="my-2 h-auto max-w-full rounded-md"
                />
              );
            }
            return null;
          }) ?? null}
        </p>
      );
    } else if (node.type === "bulletList") {
      return (
        <ul key={index} className="mb-3 list-disc pl-5 text-sm text-gray-700">
          {node.content?.map((item: any, itemIndex: number) => (
            <li key={itemIndex} className="mb-1">
              {item.content?.[0]?.content?.map(
                (textNode: any, textIndex: number) =>
                  textNode.type === "text" ? textNode.text : null,
              )}
            </li>
          ))}
        </ul>
      );
    } else if (node.type === "orderedList") {
      return (
        <ol
          key={index}
          className="mb-3 list-decimal pl-5 text-sm text-gray-700"
        >
          {node.content?.map((item: any, itemIndex: number) => (
            <li key={itemIndex} className="mb-1">
              {item.content?.[0]?.content?.map(
                (textNode: any, textIndex: number) =>
                  textNode.type === "text" ? textNode.text : null,
              )}
            </li>
          ))}
        </ol>
      );
    } else if (node.type === "blockquote") {
      return (
        <blockquote
          key={index}
          className="mb-3 border-l-4 border-gray-300 pl-4 italic text-gray-600"
        >
          {node.content?.map((p: any, pIndex: number) =>
            p.content?.map((textNode: any, textIndex: number) =>
              textNode.type === "text" ? textNode.text : null,
            ),
          )}
        </blockquote>
      );
    } else if (node.type === "image") {
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || ""}
          className="my-3 h-auto max-w-full rounded-md"
        />
      );
    }
    return null;
  });
}

export function IntroductionModal({
  dataroom,
  viewerId,
}: IntroductionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const storageKey = `dataroom-intro-seen-${dataroom.id}${viewerId ? `-${viewerId}` : ""}`;

  useEffect(() => {
    // Check if introduction is enabled and has content
    if (!dataroom.introductionEnabled || !dataroom.introductionContent) {
      return;
    }

    // Check if user has already seen the introduction - show only first time
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setIsOpen(true);
    }
  }, [dataroom.introductionEnabled, dataroom.introductionContent, storageKey]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, "true");
  };

  const handleReopen = () => {
    setIsOpen(true);
  };

  // Don't render anything if introduction is not enabled or has no content
  if (!dataroom.introductionEnabled || !dataroom.introductionContent) {
    return null;
  }

  const content = dataroom.introductionContent as any;
  const hasContent = content?.content && content.content.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <>
      {/* Info icon to reopen introduction - always visible */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleReopen}
              className="fixed right-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-gray-200 backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl dark:bg-gray-800/90 dark:ring-gray-700 dark:hover:bg-gray-800"
              aria-label="View introduction"
            >
              <InfoIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>View introduction</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Introduction Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden border-0 p-0 shadow-2xl sm:max-w-xl sm:rounded-2xl md:max-w-2xl">
          <DialogHeader className="border-b border-gray-100 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-gray-900">
            <DialogTitle className="text-xl font-semibold">
              Welcome to {dataroom.name || "Data Room"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] px-6 py-5">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderContent(content)}
            </div>
          </ScrollArea>
          <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
            <Button onClick={handleClose} size="lg">
              Continue to Data Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
