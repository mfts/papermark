"use client";

import { PropsWithChildren, useState, useEffect } from "react";

import { CircleCheck, CircleXIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { createHighlighter, type Highlighter } from "shiki";

import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";
import { useMediaQuery } from "@/lib/utils/use-media-query";

import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { ButtonTooltip } from "../ui/tooltip";

export type EventListProps = PropsWithChildren<{
  events: any[];
}>;

// Shiki Code Highlighter Component
const CodeHighlighter = ({ 
  code, 
  language = "json",
  isDark = false 
}: { 
  code: string; 
  language?: string;
  isDark?: boolean;
}) => {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  useEffect(() => {
    const initHighlighter = async () => {
      const shiki = await createHighlighter({
        themes: ['material-theme-lighter', 'material-theme-darker'],
        langs: ['json']
      });
      setHighlighter(shiki);
    };

    initHighlighter();
  }, []);

  useEffect(() => {
    if (highlighter && code) {
      const theme = isDark ? 'material-theme-darker' : 'material-theme-lighter';
      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme: theme,
        transformers: [
          {
            pre(node) {
              // Add custom styling to the pre element
              node.properties.style = [
                node.properties.style,
                'margin: 0',
                'padding: 0.5rem',
                'font-size: 0.875rem',
                'border-radius: 0.375rem',
                'overflow-x: auto'
              ].filter(Boolean).join('; ');
            },
            code(node) {
              // Ensure proper styling for the code element
              node.properties.style = [
                node.properties.style,
                'display: block',
                'line-height: 1.5'
              ].filter(Boolean).join('; ');
            }
          }
        ]
      });
      setHighlightedCode(html);
    }
  }, [highlighter, code, language, isDark]);

  if (!highlighter || !highlightedCode) {
    return (
      <pre className="rounded-md bg-gray-100 p-2 text-sm dark:bg-gray-800">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div 
      className="overflow-x-auto rounded-md"
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
};

const WebhookEvent = ({ event }: { event: any }) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard({ timeout: 2000 });
  const isSuccess = event.http_status >= 200 && event.http_status < 300;
  const { isMobile } = useMediaQuery();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between gap-5 px-3.5 py-3 hover:bg-gray-50 focus:outline-none dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <ButtonTooltip
              content={
                isSuccess
                  ? "This webhook was successfully delivered."
                  : "This webhook failed to deliver – it will be retried."
              }
            >
              <div>
                {isSuccess ? (
                  <CircleCheck className="size-4 text-green-500" />
                ) : (
                  <CircleXIcon className="size-4 text-destructive" />
                )}
              </div>
            </ButtonTooltip>
            <div className="text-sm text-foreground">{event.http_status}</div>
          </div>
          <div className="text-sm text-foreground">{event.event}</div>
        </div>

        <div className="text-xs text-muted-foreground">
          {(() => {
            const date = new Date(event.timestamp);
            const localDate = new Date(
              date.getTime() - date.getTimezoneOffset() * 60000,
            );
            return isMobile
              ? localDate.toLocaleTimeString()
              : localDate.toLocaleString();
          })()}
        </div>
      </button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex w-[90%] flex-col justify-between border-l border-gray-200 bg-background px-4 text-foreground dark:border-gray-800 dark:bg-gray-900 sm:w-[600px] sm:max-w-2xl md:px-5">
          <SheetHeader className="text-start">
            <SheetTitle>{event.event}</SheetTitle>
            <SheetDescription className="group flex items-center gap-2">
              <p className="font-mono text-sm text-gray-500">
                {event.event_id}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  copyToClipboard(event.event_id, "Copied to clipboard")
                }
              >
                <CopyIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="grid gap-4 border-t border-gray-200 bg-transparent py-4">
              <h4 className="font-semibold">Response</h4>
              <div className="flex items-center gap-8">
                <p className="text-sm text-gray-500">HTTP status code</p>
                <p className="text-sm text-gray-700">{event.http_status}</p>
              </div>
              <div className="overflow-y-scroll">
                <CodeHighlighter
                  code={JSON.stringify(event.response_body, null, 2)}
                  language="json"
                  isDark={isDark}
                />
              </div>
            </div>
            <div className="grid gap-4 border-t border-gray-200 bg-transparent py-4">
              <h4 className="font-semibold">Request</h4>
              <div className="overflow-y-scroll">
                <CodeHighlighter
                  code={JSON.stringify(event.request_body, null, 2)}
                  language="json"
                  isDark={isDark}
                />
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export const WebhookEventList = ({ events }: EventListProps) => {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-600">
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-600">
        {events.map((event, index) => (
          <WebhookEvent key={index} event={event} />
        ))}
      </div>
    </div>
  );
};
