import { getExtension } from "@/lib/utils";
import { useDocument } from "@/lib/swr/use-document";
import ErrorPage from "next/error";
import StatsCard from "@/components/documents/stats-card";
import StatsChart from "@/components/documents/stats-chart";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import Image from "next/image";
import LinksTable from "@/components/links/links-table";
import VisitorsTable from "@/components/visitors/visitors-table";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import FileUp from "@/components/shared/icons/file-up";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/router";
import MoreVertical from "@/components/shared/icons/more-vertical";
import { useTeam } from "@/context/team-context";
import ProcessStatusBar from "@/components/documents/process-status-bar";

export default function DocumentPage() {
  const { document: prismaDocument, primaryVersion, error } = useDocument();
  const router = useRouter();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const nameRef = useRef<HTMLHeadingElement>(null);
  const enterPressedRef = useRef<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const teamInfo = useTeam();

  const handleNameSubmit = async () => {
    if (enterPressedRef.current) {
      enterPressedRef.current = false;
      return;
    }
    if (nameRef.current && isEditingName) {
      const newName = nameRef.current.innerText;

      if (newName !== prismaDocument!.name) {
        const response = await fetch(
          `/api/teams/${teamInfo?.currentTeam?.id}/documents/${
            prismaDocument!.id
          }/update-name`,
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

    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}`,
      {
        method: "DELETE",
      },
    );

    if (response.ok) {
      setIsFirstClick(false);
      setMenuOpen(false);
      router.push("/documents");
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

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <AppLayout>
      <div>
        {prismaDocument && primaryVersion ? (
          <>
            {/* Heading */}
            <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 p-4 sm:flex-row sm:items-center sm:m-4">
              <div className="space-y-2">
                <div className="flex space-x-4 items-center">
                  <div className="w-8">
                    <Image
                      src={`/_icons/${getExtension(primaryVersion.file)}.svg`}
                      alt="File icon"
                      width={50}
                      height={50}
                      className=""
                    />
                  </div>
                  <div className="flex flex-col">
                    <h2
                      className="leading-7 text-2xl text-foreground font-semibold tracking-tight hover:cursor-text"
                      ref={nameRef}
                      contentEditable={true}
                      onFocus={() => setIsEditingName(true)}
                      onBlur={handleNameSubmit}
                      onKeyDown={preventEnterAndSubmit}
                      title="Click to edit"
                      dangerouslySetInnerHTML={{ __html: prismaDocument.name }}
                    />
                    {isEditingName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {`You are editing the document name. Press <Enter> to save.`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-x-4">
                <AddDocumentModal newVersion>
                  <button title="Upload a new version">
                    <FileUp className="w-6 h-6" />
                  </button>
                </AddDocumentModal>
                <DropdownMenu
                  open={menuOpen}
                  onOpenChange={handleMenuStateChange}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" ref={dropdownRef}>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      onClick={(event) =>
                        handleButtonClick(event, prismaDocument.id)
                      }
                    >
                      {isFirstClick ? "Really delete?" : "Delete document"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setIsLinkSheetOpen(true)}>
                  Create Link
                </Button>
              </div>
            </div>
            {/* Progress bar */}
            {!primaryVersion.hasPages ? (
              <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 p-4 sm:flex-row sm:items-center sm:m-4">
                <ProcessStatusBar documentVersionId={primaryVersion.id} />
              </div>
            ) : null}

            {/* Stats */}
            {prismaDocument.numPages !== null && (
              <StatsChart
                documentId={prismaDocument.id}
                totalPagesMax={primaryVersion.numPages!}
              />
            )}
            <StatsCard />
            {/* Links */}
            <LinksTable />
            {/* Visitors */}
            <VisitorsTable numPages={primaryVersion.numPages!} />
            <LinkSheet
              isOpen={isLinkSheetOpen}
              setIsOpen={setIsLinkSheetOpen}
            />
          </>
        ) : (
          <div className="h-screen flex items-center justify-center">
            <LoadingSpinner className="mr-1 h-20 w-20" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
