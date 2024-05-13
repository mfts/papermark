import { getExtension } from "@/lib/utils";
import { Document, DocumentVersion } from "@prisma/client";
import Image from "next/image";
import NotionIcon from "@/components/shared/icons/notion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { AddDocumentModal } from "./add-document-modal";
import FileUp from "@/components/shared/icons/file-up";
import { Button } from "@/components/ui/button";
import PapermarkSparkle from "@/components/shared/icons/papermark-sparkle";
import { mutate } from "swr";
import { useRouter } from "next/router";
import { usePlausible } from "next-plausible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MoreVertical from "@/components/shared/icons/more-vertical";
import { Sparkles, TrashIcon } from "lucide-react";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { useTeam } from "@/context/team-context";

export default function DocumentHeader({
  prismaDocument,
  primaryVersion,
  teamId,
  actions,
}: {
  prismaDocument: Document;
  primaryVersion: DocumentVersion;
  teamId: string;
  actions?: React.ReactNode[];
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);

  const nameRef = useRef<HTMLHeadingElement>(null);
  const enterPressedRef = useRef<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const actionRows: React.ReactNode[][] = [];
  if (actions) {
    for (let i = 0; i < actions.length; i += 3) {
      actionRows.push(actions.slice(i, i + 3));
    }
  }

  const plausible = usePlausible();

  const handleNameSubmit = async () => {
    if (enterPressedRef.current) {
      enterPressedRef.current = false;
      return;
    }
    if (nameRef.current && isEditingName) {
      const newName = nameRef.current.innerText;

      if (newName !== prismaDocument!.name) {
        const response = await fetch(
          `/api/teams/${teamId}/documents/${prismaDocument!.id}/update-name`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newName,
            }),
          },
        );

        if (response.ok) {
          const { message } = await response.json();
          toast.success(message);
        } else {
          const { message } = await response.json();
          toast.error(message);
        }
      }
      setIsEditingName(false);
    }
  };

  const preventEnterAndSubmit = (
    event: React.KeyboardEvent<HTMLHeadingElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default line break
      setIsEditingName(true);
      enterPressedRef.current = true;
      handleNameSubmit(); // Handle the submit
      if (nameRef.current) {
        nameRef.current.blur(); // Remove focus from the h2 element
      }
    }
  };

  const activateOrRedirectAssistant = async (document: Document) => {
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
          plausible("assistantEnabled", { props: { documentId: document.id } }); // track the event

          // refetch to fix the UI delay
          mutate(`/api/teams/${teamId}/documents/${document.id}`);

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

  const activateOrDeactivateAssistant = async (
    active: boolean,
    prismaDocumentId: string,
  ) => {
    const fetchPromise = fetch("/api/assistants", {
      method: active ? "POST" : "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId: prismaDocumentId,
      }),
    }).then(() => {
      // refetch to fix the UI delay
      mutate(`/api/teams/${teamId}/documents/${prismaDocumentId}`);
    });

    toast.promise(fetchPromise, {
      loading: `${active ? "Activating" : "Deactivating"} Assistant...`,
      success: `Papermark Assistant successfully ${active ? "activated" : "deactivated"}.`,
      error: `${active ? "Activation" : "Deactivation"} failed. Please try again.`,
    });
  };

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

  const handleDeleteDocument = async (documentId: string) => {
    // Prevent the first click from deleting the document
    if (!isFirstClick) {
      setIsFirstClick(true);
      return;
    }

    toast.promise(
      fetch(`/api/teams/${teamId}/documents/${documentId}`, {
        method: "DELETE",
      }).then(() => {
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`, null, {
          populateCache: (_, docs) => {
            return docs.filter(
              (doc: DocumentWithLinksAndLinkCountAndViewCount) =>
                doc.id !== documentId,
            );
          },
          revalidate: false,
        });
        setIsFirstClick(false);
        setMenuOpen(false);
        router.push("/documents");
      }),
      {
        loading: "Deleting document...",
        success: "Document deleted successfully.",
        error: "Failed to delete document. Try again.",
      },
    );
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

  return (
    <header className="flex items-center justify-between gap-x-8 !mb-16">
      <div className="flex space-x-2 items-center">
        {primaryVersion.type === "notion" ? (
          <NotionIcon className="w-7 lg:w-8 h-7 lg:h-8" />
        ) : (
          <div className="w-[25px] lg:w-[32px] h-[25px] lg:h-[32px]">
            <Image
              src={`/_icons/${getExtension(primaryVersion.file)}${isLight ? "-light" : ""}.svg`}
              alt="File icon"
              width={50}
              height={50}
            />
          </div>
        )}

        <div className="flex flex-col mt-1 lg:mt-0">
          <h2
            className="text-lg lg:text-xl xl:text-2xl text-foreground font-semibold tracking-tight py-0.5 lg:py-1 px-1 lg:px-3 rounded-md border border-transparent hover:cursor-text hover:border hover:border-border focus-visible:text-lg lg:focus-visible:text-xl duration-200"
            ref={nameRef}
            contentEditable={true}
            onFocus={() => setIsEditingName(true)}
            onBlur={handleNameSubmit}
            onKeyDown={preventEnterAndSubmit}
            title="Click to edit"
            dangerouslySetInnerHTML={{ __html: prismaDocument.name }}
          />
          {isEditingName && (
            <span className="text-xs text-muted-foreground mt-1">
              {`Press <Enter> to save the name.`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-x-4 md:gap-x-2 lg:gap-x-4">
        {primaryVersion.type !== "notion" && (
          <AddDocumentModal newVersion>
            <button title="Upload a new version" className="hidden md:flex">
              <FileUp className="w-6 h-6" />
            </button>
          </AddDocumentModal>
        )}

        {prismaDocument.type !== "notion" &&
          prismaDocument.assistantEnabled && (
            <Button
              className="group hidden md:flex h-8 lg:h-9 space-x-1 text-xs lg:text-sm whitespace-nowrap bg-gradient-to-r from-[#16222A] via-emerald-500 to-[#16222A] duration-200 ease-linear hover:bg-right"
              variant={"special"}
              size={"icon"}
              style={{ backgroundSize: "200% auto" }}
              onClick={() => activateOrRedirectAssistant(prismaDocument)}
              title="Open AI Assistant"
            >
              <PapermarkSparkle className="h-5 w-5" />
            </Button>
          )}

        <div className="flex items-center gap-x-1">
          {actionRows.map((row, i) => (
            <ul
              key={i.toString()}
              className="flex flex-wrap items-center justify-end gap-2 md:gap-4 md:flex-nowrap"
            >
              {row.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          ))}
        </div>

        <DropdownMenu open={menuOpen} onOpenChange={handleMenuStateChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 lg:h-9 w-8 lg:w-9 p-0 bg-transparent"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[180px]"
            ref={dropdownRef}
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup className="block md:hidden">
              <DropdownMenuItem>
                <AddDocumentModal newVersion>
                  <button
                    title="Add a new version"
                    className="flex items-center"
                  >
                    <FileUp className="w-4 h-4 mr-2" /> Add new version
                  </button>
                </AddDocumentModal>
              </DropdownMenuItem>

              {prismaDocument.type !== "notion" && (
                <DropdownMenuItem
                  onClick={() => activateOrRedirectAssistant(prismaDocument)}
                >
                  <PapermarkSparkle className="h-4 w-4 mr-2" />
                  Open AI Assistant
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
            </DropdownMenuGroup>

            {primaryVersion.type !== "notion" &&
              (!prismaDocument.assistantEnabled ? (
                <DropdownMenuItem
                  onClick={() =>
                    activateOrDeactivateAssistant(true, prismaDocument.id)
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Activate Assistant
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    activateOrDeactivateAssistant(false, prismaDocument.id)
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Disable Assistant
                </DropdownMenuItem>
              ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              onClick={(event) => handleButtonClick(event, prismaDocument.id)}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {isFirstClick ? "Really delete?" : "Delete document"}
            </DropdownMenuItem>
            {/* create a dropdownmenuitem that onclick calls a post request to /api/assistants with the documentId */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
