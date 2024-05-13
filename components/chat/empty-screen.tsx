import Image from "next/image";

import { Button } from "@/components/ui/button";

import Sparkle from "../shared/icons/sparkle";

const exampleMessages = [
  {
    heading: "Summarize the document",
    message: "Summarize the document in a few sentences and bullet points.",
  },
  {
    heading: "Tell me about the team",
    message:
      "Tell me more about the team behind the company. If there's no team page in the document, then let me know.",
  },
  {
    heading: "Ask a question",
    message: "What does the company do?",
  },
  {
    heading: "What is this document about?",
    message: "Please tell me in one sentence what this document is about.",
  },
];

export function EmptyScreen({
  firstPage,
  setInput,
  handleInputChange,
}: {
  firstPage?: string;
  setInput: (input: string) => void;
  handleInputChange: (e: any) => void;
}) {
  const manageInput = (message: string) => {
    setInput(message);
    handleInputChange(message);
  };

  return (
    <>
      <div className="mx-auto w-1/2 md:w-1/3">
        <div className="flex items-center justify-center">
          {firstPage ? (
            firstPage.includes("cloudfront.net") ? (
              <img
                className="rounded-md object-contain ring-1 ring-gray-700"
                src={firstPage}
                alt={`Page 1`}
                fetchPriority="high"
              />
            ) : (
              <Image
                src={firstPage}
                width={768}
                height={100}
                className="rounded-md object-contain ring-1 ring-gray-700"
                alt="First page of the document"
              />
            )
          ) : (
            <div className="flex w-full items-center justify-center rounded-md">
              <p className="text-center text-2xl">
                Chat with{" "}
                <span className="text-2xl font-bold tracking-tighter ">
                  Papermark
                </span>
                &apos;s pitchdeck
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center text-lg">
          What would you like to know?
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-sm"
              onClick={() => {
                return handleInputChange({
                  target: { value: message.message },
                });
              }}
            >
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
