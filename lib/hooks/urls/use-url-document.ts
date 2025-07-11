import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useTeam } from "@/context/team-context";
import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { useUrls } from "./use-urls";

interface UseUrlDocumentOptions {
    initialUrls?: string[];
    documentId?: string;
    isDataroom?: boolean;
    dataroomId?: string;
    newVersion?: boolean;
    canAddDocuments?: boolean;
    currentFolderPath?: string[];
    addDocumentToDataroom?: (params: { documentId: string; folderPathName?: string }) => Promise<Response | undefined>;
}

export function useUrlDocument(options: UseUrlDocumentOptions = {}) {
    const {
        initialUrls = [],
        documentId,
        isDataroom = false,
        dataroomId,
        newVersion = false,
        canAddDocuments = true,
        currentFolderPath,
        addDocumentToDataroom,
    } = options;

    const router = useRouter();
    const teamInfo = useTeam();
    const analytics = useAnalytics();
    const { plan } = usePlan();
    const [uploading, setUploading] = useState(false);
    const [docName, setDocName] = useState("");

    const {
        urls,
        invalidUrls,
        handleUrlChange,
        getValidUrls,
        getAllUrls,
        hasValidUrls,
        hasInvalidUrls,
        isUrlInputValid,
        resetUrls,
    } = useUrls({ initialUrls });

    const createUrlDocument = async (): Promise<any> => {
        if (!canAddDocuments) {
            toast.error("You have reached the maximum number of documents.");
            return null;
        }

        if (!docName || !urls.trim()) {
            toast.error("Please enter a document name and URLs to proceed.");
            return null;
        }

        const allUrls = getAllUrls();
        const validUrls = getValidUrls();

        if (validUrls.length !== allUrls.length) {
            toast.error("Please enter valid URLs to proceed.");
            return null;
        }

        try {
            setUploading(true);

            const response = await fetch(
                `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: docName,
                        url: validUrls[0],
                        contentUrls: validUrls,
                        numPages: 1,
                        type: "urls",
                        createLink: false,
                        folderPathName: currentFolderPath?.join("/"),
                    }),
                },
            );

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(error);
                return null;
            }

            const document = await response.json();
            return document;
        } catch (error) {
            console.error("An error occurred while processing the URLs document: ", error);
            toast.error(
                "Oops! Can't access the URLs document. Please double-check it's set to 'Public'.",
            );
            return null;
        } finally {
            setUploading(false);
        }
    };

    const updateUrlDocument = async (): Promise<boolean> => {
        if (!documentId) {
            toast.error("Document ID is required for updates.");
            return false;
        }

        if (!urls.trim()) {
            toast.error("Please enter at least one URL");
            return false;
        }

        const validUrls = getValidUrls();
        const allUrls = getAllUrls();

        if (validUrls.length !== allUrls.length) {
            toast.error("Please enter valid URLs to proceed");
            return false;
        }

        if (validUrls.length === 0) {
            toast.error("Please enter at least one valid URL");
            return false;
        }

        try {
            setUploading(true);

            const response = await fetch(
                `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}/update-urls`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contentUrls: validUrls,
                    }),
                },
            );

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(error || "Failed to update URLs");
                return false;
            }

            const { message } = await response.json();
            toast.success(message);
            return true;
        } catch (error) {
            console.error("Error updating URLs:", error);
            toast.error("An error occurred while updating URLs");
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleCreateUrlDocument = async () => {
        const document = await createUrlDocument();
        if (!document) return;

        if (isDataroom && dataroomId && addDocumentToDataroom) {
            const dataroomResponse = await addDocumentToDataroom({
                documentId: document.id,
                folderPathName: currentFolderPath?.join("/"),
            });

            if (dataroomResponse?.ok) {
                const dataroomDocument = await dataroomResponse.json();
                if (dataroomDocument.dataroom._count.viewerGroups > 0) {
                    return { document, dataroomDocument, showGroupPermissions: true };
                }
            }

            return { document };
        }

        if (!newVersion) {
            toast.success("URLs document processed. Redirecting to document page...");

            analytics.capture("Document Added URLs", {
                documentId: document.id,
                name: document.name,
                fileSize: null,
                path: router.asPath,
                type: "urls",
                teamId: teamInfo?.currentTeam?.id,
                dataroomId,
                $set: {
                    teamId: teamInfo?.currentTeam?.id,
                    teamPlan: plan,
                },
            });

            router.push("/documents/" + document.id);
        }

        return { document };
    };

    const resetAll = () => {
        resetUrls();
        setDocName("");
    };

    return {
        uploading,
        docName,
        setDocName,

        urls,
        invalidUrls,
        handleUrlChange,
        getValidUrls,
        hasValidUrls,
        hasInvalidUrls,
        isUrlInputValid,
        resetUrls,
        resetAll,

        createUrlDocument,
        updateUrlDocument,
        handleCreateUrlDocument,
    };
} 