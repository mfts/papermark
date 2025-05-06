import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { format } from "date-fns";
import { CircleHelpIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { copyToClipboard, fetcher } from "@/lib/utils";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeTooltip } from "@/components/ui/tooltip";

interface Token {
  id: string;
  name: string;
  partialKey: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function TokenSettings() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const router = useRouter();
  const [name, setName] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Replace the useEffect with useSWR for feature flags
  const { data: features } = useSWR<{ tokens: boolean }>(
    teamId ? `/api/feature-flags?teamId=${teamId}` : null,
    fetcher,
  );

  // Redirect if feature is not enabled
  useEffect(() => {
    if (features && !features.tokens) {
      router.push("/settings/general");
      toast.error("This feature is not available for your team");
    }
  }, [features, router]);

  const { data: tokens, mutate } = useSWR<Token[]>(
    teamId ? `/api/teams/${teamId}/tokens` : null,
    fetcher,
  );

  const generateToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teams/${teamId}/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setToken(data.token);
      toast.success("API token generated successfully");

      // After successful token generation, refresh the tokens list
      mutate();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to generate token");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/tokens`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Refresh the tokens list
      mutate();
      toast.success("Token revoked successfully");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to revoke token");
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col items-center justify-between gap-4 space-y-3 border-b border-gray-200 p-5 sm:flex-row sm:space-y-0 sm:p-10">
            <div className="flex max-w-screen-sm flex-col space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium text-gray-900">
                  API Tokens
                </h2>
                <BadgeTooltip content="Use these tokens to authenticate your API requests">
                  <CircleHelpIcon className="h-4 w-4 text-gray-500" />
                </BadgeTooltip>
              </div>
              <p className="text-sm text-gray-500">
                Create API tokens to integrate Papermark with your applications.
                Keep your tokens secure and never share them publicly.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-10">
            <div className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="token-name" className="text-gray-900">
                  Token Name
                </Label>
                <Input
                  id="token-name"
                  placeholder="Enter a name for your token"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-gray-900 dark:bg-white"
                />
              </div>

              {token && (
                <div className="rounded-lg bg-gray-50 p-4 text-gray-900">
                  <div className="flex items-center gap-2">
                    <Label>
                      Your API Token (copy it now, it won&apos;t be shown again)
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(`${token}`, "Token copied to clipboard")
                      }
                    >
                      <CopyIcon />
                    </Button>
                  </div>
                  <code className="mt-2 block break-all rounded bg-gray-100 p-2 font-mono text-sm">
                    {token}
                  </code>
                </div>
              )}

              <Button
                onClick={generateToken}
                disabled={!name || isLoading}
                className="w-fit bg-gray-900 text-gray-50 hover:bg-gray-900/90"
              >
                {isLoading ? "Generating..." : "Generate Token"}
              </Button>

              {/* Tokens List */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  Existing Tokens
                </h3>
                <div className="rounded-lg border border-gray-200">
                  {tokens?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No tokens generated yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {tokens?.map((token) => (
                        <div
                          key={token.id}
                          className="flex items-center justify-between p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">
                              {token.name}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span className="font-mono">
                                {token.partialKey}
                              </span>
                              <span>•</span>
                              <span>Created by {token.user.name}</span>
                              <span>•</span>
                              <span>
                                {format(
                                  new Date(token.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteToken(token.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
