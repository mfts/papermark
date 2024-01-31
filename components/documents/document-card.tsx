import { nFormatter, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { TeamContextType } from "@/context/team-context";
import BarChart from "@/components/shared/icons/bar-chart";
import Image from "next/image";
import NotionIcon from "@/components/shared/icons/notion";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrashIcon, MoreVertical } from "lucide-react";
import { mutate } from "swr";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";
import Check from "../shared/icons/check";
import Copy from "../shared/icons/copy";
import { useEffect, useRef, useState } from "react";

type DocumentsCardProps = {
  document: DocumentWithLinksAndLinkCountAndViewCount;
  teamInfo: TeamContextType | null;
};
export default function DocumentsCard({
  document: prismaDocument,
  teamInfo,
}: DocumentsCardProps) {
  const router = useRouter();
  const { isCopied, copyToClipboard } = useCopyToClipboard({});
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  function handleCopyToClipboard(id: string) {
    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`,
      "Link copied to clipboard.",
    );
  }

  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
        setIsFirstClick(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = (event: any, documentId: string) => {
    event.stopPropagation();
    event.preventDefault();

    if (isFirstClick) {
      handleDeleteDocument(documentId);
      setIsFirstClick(false);
      setMenuOpen(false); // Close the dropdown after deleting
    } else {
      setIsFirstClick(true);
    }
  };

  const activateOrRedirectAssistant = async () => {
    if (prismaDocument.assistantEnabled) {
      router.push(`/documents/${prismaDocument.id}/chat`);
    } else {
      toast.promise(
        fetch("/api/assistants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: prismaDocument.id,
          }),
        }).then(() => {
          // Once the assistant is activated, redirect to the chat
          router.push(`/documents/${prismaDocument.id}/chat`);
        }),
        {
          loading: "Activating Assistant...",
          success: "Papermark Assistant successfully activated.",
          error: "Activation failed. Please try again.",
        },
      );
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    // Prevent the first click from deleting the document
    if (!isFirstClick) {
      setIsFirstClick(true);
      return;
    }

    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}`,
      {
        method: "DELETE",
      },
    );

    if (response.ok) {
      // remove the document from the cache
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`, null, {
        populateCache: (_, docs) => {
          return docs.filter(
            (doc: DocumentWithLinksAndLinkCountAndViewCount) =>
              doc.id !== documentId,
          );
        },
        revalidate: false,
      });
      toast.success("Document deleted successfully.");
    } else {
      const { message } = await response.json();
      toast.error(message);
    }
  };

  const handleMenuStateChange = (open: boolean) => {
    if (isFirstClick) {
      setMenuOpen(true); // Keep the dropdown open on the first click
      return;
    }

    // If the menu is closed, reset the isFirstClick state
    if (!open) {
      setIsFirstClick(false);
      setMenuOpen(false); // Ensure the dropdown is closed
    } else {
      setMenuOpen(true); // Open the dropdown
    }
  };

  return (
    <li className="group/row relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-300 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-2 sm:space-x-4">
        <div className="w-8 mx-0.5 sm:mx-1 text-center flex justify-center items-center">
          {prismaDocument.type === "notion" ? (
            <NotionIcon className="w-8 h-8" />
          ) : (
            <Image
              src={`/_icons/${prismaDocument.type}.svg`}
              alt="File icon"
              width={50}
              height={50}
              className=""
            />
          )}
        </div>

        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[150px] sm:max-w-md">
              <Link
                href={`/documents/${prismaDocument.id}`}
                className="truncate w-full"
              >
                <span>{prismaDocument.name}</span>
                <span className="absolute inset-0" />
              </Link>
            </h2>
            <div className="flex ml-2">
              <button
                className="group rounded-md bg-gray-200 dark:bg-gray-700 z-10 p-1 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 hover:dark:bg-emerald-200 active:scale-95"
                onClick={() =>
                  handleCopyToClipboard(prismaDocument.links[0].id)
                }
                title="Copy to clipboard"
              >
                {isCopied ? (
                  <Check className="size-3 text-muted-foreground group-hover:text-emerald-700" />
                ) : (
                  <Copy className="size-3 text-muted-foreground group-hover:text-emerald-700" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
            <p className="truncate">{timeAgo(prismaDocument.createdAt)}</p>
            <p>•</p>
            <p className="truncate">
              {prismaDocument._count.links}{" "}
              {prismaDocument._count.links === 1 ? "Link" : "Links"}
            </p>
            {prismaDocument._count.versions > 1 ? (
              <>
                <p>•</p>
                <p className="truncate">{`${prismaDocument._count.versions} Versions`}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-row space-x-2">
        {prismaDocument.type !== "notion" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              activateOrRedirectAssistant();
            }}
            className="group/button flex items-center z-10 space-x-1 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 px-1 sm:px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-95"
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
          href={`/documents/${prismaDocument.id}`}
          className="flex items-center z-10 space-x-1 rounded-md bg-gray-200 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100"
        >
          <BarChart className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground" />
          <p className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
            {nFormatter(prismaDocument._count.views)}
            <span className="ml-1 hidden sm:inline-block">views</span>
          </p>
        </Link>

        <DropdownMenu open={menuOpen} onOpenChange={handleMenuStateChange}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="w-6 sm:w-7 h-6 sm:h-7 z-10"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" ref={dropdownRef}>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(event) => handleButtonClick(event, prismaDocument.id)}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground duration-200"
            >
              {isFirstClick ? (
                "Really delete?"
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" /> Delete document
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
