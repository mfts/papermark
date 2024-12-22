import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Document, DocumentVersion } from "@prisma/client";
import {
  AlertCircleIcon,
  BetweenHorizontalStartIcon,
  CloudDownloadIcon,
  DownloadIcon,
  FileDownIcon,
  SheetIcon,
  Sparkles,
  TrashIcon,
  ViewIcon,
} from "lucide-react";
import { usePlausible } from "next-plausible";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { mutate } from "swr";

import FileUp from "@/components/shared/icons/file-up";
import MoreVertical from "@/components/shared/icons/more-vertical";
import PapermarkSparkle from "@/components/shared/icons/papermark-sparkle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getFile } from "@/lib/files/get-file";
import { usePlan } from "@/lib/swr/use-billing";
import useDatarooms from "@/lib/swr/use-datarooms";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

import PlanBadge from "../billing/plan-badge";
import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import AdvancedSheet from "../shared/icons/advanced-sheet";
import PortraitLandscape from "../shared/icons/portrait-landscape";
import { Alert, AlertClose, AlertDescription, AlertTitle } from "../ui/alert";
import LoadingSpinner from "../ui/loading-spinner";
import { ButtonTooltip } from "../ui/tooltip";
import { AddDocumentModal } from "./add-document-modal";
import { AddToDataroomModal } from "./add-document-to-dataroom-modal";

export default function DocumentHeader({
  prismaDocument,
  primaryVersion,
  teamId,
  actions,
}: {
  prismaDocument: Document & { hasPageLinks?: boolean };
  primaryVersion: DocumentVersion;
  teamId: string;
  actions?: React.ReactNode[];
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const { datarooms: datarooms } = useDatarooms();
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const { plan, trial } = usePlan();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const [orientationLoading, setOrientationLoading] = useState<boolean>(false);
  const [addDataRoomOpen, setAddDataRoomOpen] = useState<boolean>(false);
  const [addDocumentVersion, setAddDocumentVersion] = useState<boolean>(false);
  const [openAddDocModal, setOpenAddDocModal] = useState<boolean>(false);
  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);
  const [planModalTrigger, setPlanModalTrigger] = useState<string>("");
  const nameRef = useRef<HTMLHeadingElement>(null);
  const enterPressedRef = useRef<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isFree = plan === "free";
  const isTrial = !!trial;
  const actionRows: React.ReactNode[][] = [];

  if (actions) {
    for (let i = 0; i < actions.length; i += 3) {
      actionRows.push(actions.slice(i, i + 3));
    }
  }

  const currentTime = new Date();
  const formattedTime =
    currentTime.getFullYear() +
    "-" +
    String(currentTime.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(currentTime.getDate()).padStart(2, "0") +
    "_" +
    String(currentTime.getHours()).padStart(2, "0") +
    "-" +
    String(currentTime.getMinutes()).padStart(2, "0");
  "-" + String(currentTime.getSeconds()).padStart(2, "0");

  const plausible = usePlausible();

  // https://github.com/radix-ui/primitives/issues/1241#issuecomment-1888232392
  useEffect(() => {
    if (!addDataRoomOpen || !addDocumentVersion) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      });
    }
  }, [addDataRoomOpen, addDocumentVersion]);

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

  const changeDocumentOrientation = async () => {
    setOrientationLoading(true);
    try {
      const response = await fetch(
        "/api/teams/" +
          teamId +
          "/documents/" +
          prismaDocument.id +
          "/change-orientation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versionId: primaryVersion.id,
            isVertical: primaryVersion.isVertical ? false : true,
          }),
        },
      );

      if (response.ok) {
        const { message } = await response.json();
        toast.success(message);

        mutate(`/api/teams/${teamId}/documents/${prismaDocument.id}`);
      } else {
        const { message } = await response.json();
        toast.error(message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setOrientationLoading(false);
    }
  };

  const enableAdvancedExcel = async (document: Document) => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${document.id}/advanced-mode`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      if (!response.ok) {
        const { message } = await response.json();
        toast.error(message);
      } else {
        const { message } = await response.json();
        plausible("advancedExcelEnabled", {
          props: { documentId: document.id },
        }); // track the event
        toast.success(message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  // export method to fetch the visits data and convert to csv.
  const exportVisitCounts = async (document: Document) => {
    if (isFree) {
      toast.error("This feature is not available for your plan");
      return;
    }
    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${document.id}/export-visits`,
        { method: "GET" },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Create and download the CSV file
      const blob = new Blob([data.visits], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${data.documentName}_visits_${formattedTime}.csv`,
      );
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV file downloaded successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        "An error occurred while downloading the CSV. Please try again.",
      );
    }
  };

  // Make a document download only or viewable
  const toggleDownloadOnly = async () => {
    toast.promise(
      fetch(
        `/api/teams/${teamId}/documents/${prismaDocument.id}/toggle-download-only`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            downloadOnly: !prismaDocument.downloadOnly,
          }),
        },
      ).then(() => {
        mutate(`/api/teams/${teamId}/documents/${prismaDocument.id}`);
      }),
      {
        loading: "Updating document...",
        success: `Document is now ${
          !prismaDocument.downloadOnly ? "download only" : "viewable"
        }`,
        error: "Failed to update document",
      },
    );
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

  const downloadDocument = async (documentVersion: DocumentVersion) => {
    if (documentVersion.type === "notion") {
      toast.error("Notion documents cannot be downloaded.");
      return;
    }
    toast.promise(
      (async () => {
        const downloadUrl = await getFile({
          type: documentVersion.storageType,
          data: documentVersion.originalFile ?? documentVersion.file,
          isDownload: true,
        });

        // Fetch the file from the S3 URL and create blob
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = prismaDocument.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })(),
      {
        loading: "Downloading document...",
        success: "Document downloaded successfully",
        error: "Failed to download document",
      },
    );
  };

  console.log("Primary version", primaryVersion);

  return (
    <header className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between gap-x-8">
        <div className="flex items-center space-x-2">
          {fileIcon({
            fileType: prismaDocument.type ?? "",
            className: "size-7 sm:size-8",
            isLight,
          })}

          <div className="mt-1 flex flex-col lg:mt-0">
            <h2
              className="rounded-md border border-transparent px-1 py-0.5 text-lg font-semibold tracking-tight text-foreground duration-200 hover:cursor-text hover:border hover:border-border focus-visible:text-lg lg:px-3 lg:py-1 lg:text-xl lg:focus-visible:text-xl xl:text-2xl"
              ref={nameRef}
              contentEditable={true}
              onFocus={() => setIsEditingName(true)}
              onBlur={handleNameSubmit}
              onKeyDown={preventEnterAndSubmit}
              title="Click to edit"
              dangerouslySetInnerHTML={{ __html: prismaDocument.name }}
            />
            {isEditingName && (
              <span className="mt-1 text-xs text-muted-foreground">
                {`Press <Enter> to save the name.`}
              </span>
            )}
          </div>

          {prismaDocument.type === "sheet" &&
            prismaDocument.advancedExcelEnabled && (
              <ButtonTooltip content="Advanced Excel mode">
                <span className="mt-1 text-xs">
                  <AdvancedSheet className="h-6 w-6" />
                </span>
              </ButtonTooltip>
            )}

          {prismaDocument.downloadOnly && (
            <ButtonTooltip content="Download only">
              <span className="text-xs">
                <CloudDownloadIcon className="h-6 w-6" />
                <span className="sr-only">This document is download only</span>
              </span>
            </ButtonTooltip>
          )}
        </div>

        <div className="flex items-center gap-x-4 md:gap-x-2">
          {primaryVersion.type !== "notion" &&
            primaryVersion.type !== "sheet" &&
            primaryVersion.type !== "zip" &&
            (!orientationLoading ? (
              <ButtonTooltip content="Change orientation">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={changeDocumentOrientation}
                  title={`Change document orientation to ${primaryVersion.isVertical ? "landscape" : "portrait"}`}
                >
                  <PortraitLandscape
                    className={cn(
                      "h-6 w-6",
                      !primaryVersion.isVertical && "-rotate-90 transform",
                    )}
                  />
                </Button>
              </ButtonTooltip>
            ) : (
              <div className="hidden md:flex">
                <LoadingSpinner className="h-6 w-6" />
              </div>
            ))}

          {primaryVersion.type !== "notion" && (
            <AddDocumentModal
              newVersion
              openModal={openAddDocModal}
              setAddDocumentModalOpen={setOpenAddDocModal}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAddDocModal(true);
                }}
                className="hidden md:flex"
              >
                <FileUp className="h-6 w-6" />
              </Button>
            </AddDocumentModal>
          )}

          {prismaDocument.type !== "notion" &&
            prismaDocument.type !== "sheet" &&
            prismaDocument.type !== "zip" &&
            prismaDocument.assistantEnabled && (
              <Button
                className="group hidden h-8 space-x-1 whitespace-nowrap bg-gradient-to-r from-[#16222A] via-emerald-500 to-[#16222A] text-xs duration-200 ease-linear hover:bg-right md:flex lg:h-9 lg:text-sm"
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
                className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap md:gap-4"
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
                className="h-8 w-8 bg-transparent p-0 lg:h-9 lg:w-9"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[240px]"
              ref={dropdownRef}
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup className="block md:hidden">
                {prismaDocument.type !== "notion" && (
                  <DropdownMenuItem>
                    <AddDocumentModal
                      newVersion
                      setAddDocumentModalOpen={setAddDocumentVersion}
                    >
                      <button
                        title="Add a new version"
                        className="flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddDocumentVersion(true);
                        }}
                      >
                        <FileUp className="mr-2 h-4 w-4" /> Add new version
                      </button>
                    </AddDocumentModal>
                  </DropdownMenuItem>
                )}

                {prismaDocument.type !== "notion" &&
                  prismaDocument.type !== "sheet" &&
                  prismaDocument.type !== "zip" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => changeDocumentOrientation()}
                      >
                        <PortraitLandscape
                          className={cn(
                            "mr-2 h-4 w-4",
                            !primaryVersion.isVertical &&
                              "-rotate-90 transform",
                          )}
                        />
                        Change orientation
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() =>
                          activateOrRedirectAssistant(prismaDocument)
                        }
                      >
                        <PapermarkSparkle className="mr-2 h-4 w-4" />
                        Open AI Assistant
                      </DropdownMenuItem>
                    </>
                  )}

                <DropdownMenuSeparator />
              </DropdownMenuGroup>
              {primaryVersion.type !== "notion" &&
                primaryVersion.type !== "sheet" &&
                primaryVersion.type !== "zip" &&
                (!prismaDocument.assistantEnabled ? (
                  <DropdownMenuItem
                    onClick={() =>
                      activateOrDeactivateAssistant(true, prismaDocument.id)
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Activate Assistant
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      activateOrDeactivateAssistant(false, prismaDocument.id)
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Disable Assistant
                  </DropdownMenuItem>
                ))}
              {prismaDocument.type === "sheet" &&
                !prismaDocument.advancedExcelEnabled &&
                (plan === "business" || plan === "datarooms" || isTrial) && (
                  <DropdownMenuItem
                    onClick={() => enableAdvancedExcel(prismaDocument)}
                  >
                    <SheetIcon className="mr-2 h-4 w-4" />
                    Enable Advanced Mode
                  </DropdownMenuItem>
                )}
              {datarooms && datarooms.length !== 0 && (
                <DropdownMenuItem onClick={() => setAddDataRoomOpen(true)}>
                  <BetweenHorizontalStartIcon className="mr-2 h-4 w-4" />
                  Add to dataroom
                </DropdownMenuItem>
              )}

              {primaryVersion.type !== "notion" &&
                primaryVersion.type !== "zip" && (
                  <DropdownMenuItem
                    onClick={() =>
                      isFree
                        ? (setPlanModalTrigger("download-only-document"),
                          setPlanModalOpen(true))
                        : toggleDownloadOnly()
                    }
                  >
                    {prismaDocument.downloadOnly ? (
                      <>
                        <ViewIcon className="mr-2 h-4 w-4" />
                        Set viewable
                      </>
                    ) : (
                      <>
                        <CloudDownloadIcon className="mr-2 h-4 w-4" />
                        Set download only{" "}
                        {isFree && <PlanBadge className="ml-2" plan="pro" />}
                      </>
                    )}
                  </DropdownMenuItem>
                )}

              <DropdownMenuSeparator />

              {/* Export views in CSV */}
              <DropdownMenuItem
                onClick={() =>
                  isFree
                    ? (setPlanModalTrigger("export-document-visits"),
                      setPlanModalOpen(true))
                    : exportVisitCounts(prismaDocument)
                }
              >
                <FileDownIcon className="mr-2 h-4 w-4" />
                Export visits{" "}
                {isFree && <PlanBadge className="ml-2" plan="pro" />}
              </DropdownMenuItem>

              {/* Download latest version */}
              {primaryVersion.type !== "notion" ? (
                <DropdownMenuItem
                  onClick={() => downloadDocument(primaryVersion)}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download latest version
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={(event) => handleButtonClick(event, prismaDocument.id)}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                {isFirstClick ? "Really delete?" : "Delete document"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isFree && prismaDocument.hasPageLinks ? (
        <Alert id="in-document-links-alert" variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>In-document links detected</AlertTitle>
          <AlertDescription>
            External in-document links are not available on the free plan.
            Upgrade to a{" "}
            <span
              className="cursor-pointer underline underline-offset-4 hover:text-destructive/80"
              onClick={() => {
                setPlanModalTrigger("in-document-links");
                setPlanModalOpen(true);
              }}
            >
              higher plan
            </span>{" "}
            to use this feature.
          </AlertDescription>
          <AlertClose
            onClick={() => {
              const alert = document.getElementById("in-document-links-alert");
              if (alert) {
                alert.style.display = "none";
              }
            }}
          />
        </Alert>
      ) : null}

      {addDataRoomOpen ? (
        <AddToDataroomModal
          open={addDataRoomOpen}
          setOpen={setAddDataRoomOpen}
          documentId={prismaDocument.id}
          documentName={prismaDocument.name}
        />
      ) : null}

      {planModalOpen ? (
        <UpgradePlanModal
          clickedPlan="Pro"
          trigger={planModalTrigger}
          open={planModalOpen}
          setOpen={setPlanModalOpen}
        />
      ) : null}
    </header>
  );
}
