import { useEffect, useRef } from "react";



import { type UIMessage } from "@ai-sdk/react";
import Textarea from "react-textarea-autosize";

import { cn } from "@/lib/utils";
import { useEnterSubmit } from "@/lib/utils/use-enter-submit";

import { Button } from "@/components/ui/button";

import ArrowUp from "../shared/icons/arrow-up";

export function ChatInput({
  status,
  error,
  input,
  setInput,
  handleInputChange,
  submitMessage,
  messages,
}: {
  status: string;
  error: unknown;
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: any) => void;
  submitMessage: (e: any) => Promise<void>;
  messages: UIMessage[];
}) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (status === "idle") {
      inputRef.current?.focus();
    }
  }, [status]);

  return (
    <div className="relative inset-x-0 bottom-0">
      <div className="mx-auto sm:max-w-3xl sm:px-4">
        <div className="space-y-4 bg-background px-4 py-4 md:py-4">
          <form onSubmit={submitMessage} ref={formRef}>
            <div className="relative flex max-h-60 w-full flex-col overflow-hidden rounded-xl bg-background pr-8 ring-1 ring-muted-foreground/50 focus-within:ring-1 focus-within:ring-foreground sm:pr-12">
              <Textarea
                ref={inputRef}
                tabIndex={0}
                rows={1}
                onKeyDown={onKeyDown}
                disabled={status === "streaming"}
                className="min-h-[60px] w-full resize-none border-none bg-transparent px-4 py-[1.3rem] focus:ring-0 sm:text-sm"
                value={input}
                placeholder="Message Papermark Assistant..."
                onChange={handleInputChange}
                spellCheck={false}
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  type="submit"
                  disabled={status === "streaming" || input === ""}
                  title="Send message"
                  className="h-10 w-10 rounded-md p-1 md:p-2"
                >
                  <ArrowUp className="h-full w-full" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}