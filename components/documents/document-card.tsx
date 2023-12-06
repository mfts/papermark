import { copyToClipboard, nFormatter, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import Copy from "@/components/shared/icons/copy";
import BarChart from "@/components/shared/icons/bar-chart";
import Image from "next/image";
import NotionIcon from "@/components/shared/icons/notion";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import { toast } from "sonner";
import { useRouter } from "next/router";

export default function DocumentsCard({
  document,
}: {
  document: DocumentWithLinksAndLinkCountAndViewCount;
}) {
  const router = useRouter();

  function handleCopyToClipboard(id: string) {
    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`,
      "Link copied to clipboard.",
    );
  }

  const activateOrRedirectAssistant = async () => {
    if (document.assistantEnabled) {
      router.push(`/documents/${document.id}/chat`);
    } else {
      toast.promise(
        fetch("/api/assistants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: document.id,
          }),
        }).then(() => {
          // Once the assistant is activated, redirect to the chat
          router.push(`/documents/${document.id}/chat`);
        }),
        {
          loading: "Activating Assistant...",
          success: "Papermark Assistant successfully activated.",
          error: "Activation failed. Please try again.",
        },
      );
    }
  };

  return (
    <li className="group/row relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-400 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-4">
        <div className="w-8 mx-1 text-center flex justify-center items-center">
          {document.type === "notion" ? (
            <NotionIcon className="w-8 h-8" />
          ) : (
            <Image
              src={`/_icons/${document.type}.svg`}
              alt="File icon"
              width={50}
              height={50}
              className=""
            />
          )}
        </div>
        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[240px] sm:max-w-md">
              <Link href={`/documents/${document.id}`}>
                <span className="">{document.name}</span>
                <span className="absolute inset-0" />
              </Link>
            </h2>
            <div className="flex ml-2">
              <button
                className="group rounded-full bg-gray-200 dark:bg-gray-700 z-10 p-1.5 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 hover:dark:bg-emerald-200 active:scale-95"
                onClick={() => handleCopyToClipboard(document.links[0].id)}
                title="Copy to clipboard"
              >
                <Copy
                  className="text-gray-400 group-hover:text-emerald-700"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
            <p className="truncate">{timeAgo(document.createdAt)}</p>
            <p>•</p>
            <p className="truncate">{`${document._count.links} ${
              document._count.links === 1 ? "Link" : "Links"
            }`}</p>
            {document._count.versions > 1 ? (
              <>
                <p>•</p>
                <p className="truncate">{`${document._count.versions} Versions`}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-row space-x-2">
        {document.type !== "notion" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              activateOrRedirectAssistant();
            }}
            className="group/button flex items-center z-10 space-x-1 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-95"
          >
            <PapermarkSparkle className="h-4 w-4 text-gray-400 group-hover/row:text-foreground group-hover/row:animate-pulse group-hover/button:text-foreground group-hover/button:animate-none" />
            <span className="whitespace-nowrap text-sm ml-1 hidden sm:inline-block text-gray-400 group-hover/button:text-foreground">
              AI Assistant
            </span>
          </button>
        ) : null}

        <Link
          onClick={(e) => {
            e.stopPropagation();
          }}
          href={`/documents/${document.id}`}
          className="flex items-center z-10 space-x-1 rounded-md bg-gray-200 dark:bg-gray-700 px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100"
        >
          <BarChart className="h-4 w-4 text-muted-foreground" />
          <p className="whitespace-nowrap text-sm text-muted-foreground">
            {nFormatter(document._count.views)}
            <span className="ml-1 hidden sm:inline-block">views</span>
          </p>
        </Link>
      </div>
    </li>
  );
}
