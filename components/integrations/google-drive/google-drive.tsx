import { useSearchParams } from "next/navigation";

import { useCallback, useEffect, useState } from "react";

import { Loader2, Unlink2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  GoogleDriveIntegrationResponse,
  useGoogleDriveIntegration,
} from "@/lib/swr/use-google-drive-integration";
import { cn } from "@/lib/utils";

import GoogleDrive from "@/components/shared/icons/google-drive";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GoogleDriveStatus {
  isConnected: boolean;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  googleDriveIntegration: GoogleDriveIntegrationResponse | undefined;
  mutate: any;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// Custom hook for handling Google Drive connection status
export const useGoogleDriveStatus = (): GoogleDriveStatus => {
  const {
    data: googleDriveIntegration,
    isLoading: loading,
    mutate,
  } = useGoogleDriveIntegration();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    setIsConnected(googleDriveIntegration?.isConnected || false);
    setIsLoading(loading);
  }, [googleDriveIntegration, loading]);

  return {
    isConnected,
    setIsConnected,
    isLoading,
    googleDriveIntegration,
    mutate,
    setIsLoading,
  };
};

const removeSuccessAndErrorParams = () => {
  window.history.replaceState({}, "", window.location.pathname);
};

export const scope = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.activity.readonly",
];

// Custom hook for handling URL parameters
const useUrlParameters = (
  setIsConnected: (value: boolean) => void,
  mutate: () => void,
) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams?.get("success");
    const error = searchParams?.get("error");

    if (success === "true") {
      toast.success("Successfully connected to Google Drive");
      setIsConnected(true);
      mutate();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_code_or_state:
          "Oops! Something went wrong during the connection process. Please try again.",
        token_exchange_failed:
          "We couldn't complete the connection to Google Drive. Please try again.",
        server_error:
          "We're experiencing technical difficulties. Please try again later.",
        invalid_checksum:
          "The connection request appears to be invalid. Please try connecting again.",
        email_mismatch:
          "The Google account you selected doesn't match your profile. Please use the same email address.",
        state_verification_failed:
          "Your connection request has expired. Please try connecting again.",
        invalid_state:
          "Your connection request appears to be invalid. Please try connecting again.",
        info_fetch_failed:
          "We couldn't fetch your Google Drive information. Please try again later.",
        insufficient_permissions:
          "Please grant all required permissions to connect to Google Drive.",
        database_error:
          "We're experiencing technical difficulties. Please try again later.",
      };

      const errorMessage =
        errorMessages[error] || "Failed to connect to Google Drive";
      toast.error(errorMessage);
    }
    if (success === "true" || error) {
      removeSuccessAndErrorParams();
    }
  }, [searchParams, setIsConnected, mutate]);
};

export default function GoogleDriveIntegration({
  className,
}: {
  className?: string;
}) {
  const { data: session } = useSession();
  const { isConnected, setIsConnected, isLoading, setIsLoading, mutate } =
    useGoogleDriveStatus();

  useUrlParameters(setIsConnected, mutate);

  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    if (!session) {
      toast.error("You must be logged in to connect Google Drive");
      setIsLoading(false);
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Google client ID is not configured");
      toast.error(
        "Unable to connect to Google Drive due to missing configuration. Please contact support if this issue persists.",
      );
      setIsLoading(false);
      return;
    }

    const redirectUri = `${window.location.origin}/api/integrations/google-drive/callback`;

    // Generate state parameter securely on the server
    const response = await fetch(
      "/api/integrations/google-drive/generate-state",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      toast.error(
        "Something went wrong during the connection process. Please try again.",
      );
      console.error("Failed to generate security token");
      setIsLoading(false);
      return;
    }

    const { state } = await response.json();

    const scopeString = scope.join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopeString)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(state)}` +
      `&service=lso` +
      `&o2v=2` +
      `&ddm=1` +
      `&flowName=GeneralOAuthFlow`;

    window.location.href = authUrl;
  }, [session, setIsLoading]);

  const handleDisconnect = useCallback(async () => {
    if (!session) {
      toast.error("You must be logged in to disconnect Google Drive");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/integrations/google-drive/disconnect",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to disconnect Google Drive: ${response.status}`,
        );
      }

      setIsConnected(false);
      mutate();
      toast.success("Successfully disconnected Google Drive");
    } catch (error) {
      console.error("Error disconnecting Google Drive:", error);
      toast.error("Failed to disconnect Google Drive");
    } finally {
      setIsLoading(false);
    }
  }, [session, setIsConnected, setIsLoading, mutate]);

  return (
    <Card className="p-6">
      <div className={cn(`flex items-center justify-between`, className)}>
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-background">
            <GoogleDrive className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium">Google Drive</h3>
              <Badge variant={isConnected ? "outline" : "secondary"}>
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isConnected
                ? "Access and import files directly from your Google Drive"
                : "Sync your Google Drive account to import files"}
            </p>
          </div>
        </div>
        <Button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isLoading}
          variant={isConnected ? "destructive" : "default"}
          className="ml-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isConnected ? "Disconnecting..." : "Connecting..."}
            </>
          ) : (
            <>
              {isConnected ? (
                <>
                  <Unlink2Icon className="mr-2 h-4 w-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <GoogleDrive className="mr-2 h-4 w-4" />
                  Connect
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}