
import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import { GoogleDriveIntegration } from "@prisma/client";

export type GoogleDriveIntegrationResponse = {
    integration: GoogleDriveIntegration;
    isConnected: boolean;
}

export function useGoogleDriveIntegration() {
    const { data, error, mutate, isLoading } = useSWR<GoogleDriveIntegrationResponse>("/api/integrations/google-drive", fetcher, {
        revalidateOnFocus: false,
    });

    return { data, error, isLoading, mutate };
}