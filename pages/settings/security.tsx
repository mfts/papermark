import { useEffect, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useGetTeam } from "@/lib/swr/use-team";
import { CustomUser } from "@/lib/types";

import { DirectorySyncConfigModal } from "@/components/settings/directory-sync-config-modal";
import { SAMLConfigModal } from "@/components/settings/saml-config-modal";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";

type SAMLConnection = {
  clientID: string;
  name?: string;
  description?: string;
  idpMetadata?: {
    provider?: string;
    friendlyProviderName?: string | null;
    entityID?: string;
  };
};

type SAMLResponse = {
  connections: SAMLConnection[];
  issuer: string;
  acs: string;
};

type DirectoryConnection = {
  id: string;
  name: string;
  type: string;
  scim: {
    endpoint?: string;
    path: string;
    secret: string;
  };
};

type DirectoryResponse = {
  directories: DirectoryConnection[];
};

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const { team } = useGetTeam();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [samlData, setSamlData] = useState<SAMLResponse | null>(null);
  const [directoryData, setDirectoryData] = useState<DirectoryResponse | null>(
    null,
  );

  const [showSamlModal, setShowSamlModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);

  const [removingSaml, setRemovingSaml] = useState(false);
  const [removingDirectory, setRemovingDirectory] = useState(false);

  const [latestScimSecret, setLatestScimSecret] = useState<string | null>(null);
  const [showScimSecret, setShowScimSecret] = useState(false);

  const currentUserId = (session?.user as CustomUser | undefined)?.id;

  const isAdmin = useMemo(() => {
    if (!currentUserId || !team?.users) return false;
    return team.users.some(
      (member) => member.userId === currentUserId && member.role === "ADMIN",
    );
  }, [currentUserId, team?.users]);

  const samlConnection = samlData?.connections?.[0];
  const directory = directoryData?.directories?.[0];

  const displayedScimSecret = useMemo(() => {
    if (latestScimSecret) return latestScimSecret;
    if (!directory?.scim?.secret) return null;
    return showScimSecret ? directory.scim.secret : null;
  }, [directory?.scim?.secret, latestScimSecret, showScimSecret]);

  async function refreshSecurityState() {
    if (!teamId) return;

    setLoading(true);
    setLoadError(null);

    try {
      const [samlResponse, directoryResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/saml`),
        fetch(`/api/teams/${teamId}/directory-sync`),
      ]);

      if (!samlResponse.ok) {
        const payload = await samlResponse.json();
        throw new Error(payload.error || "Failed to fetch SAML configuration.");
      }

      if (!directoryResponse.ok) {
        const payload = await directoryResponse.json();
        throw new Error(payload.error || "Failed to fetch SCIM configuration.");
      }

      const samlPayload = (await samlResponse.json()) as SAMLResponse;
      const directoryPayload = (await directoryResponse.json()) as DirectoryResponse;

      setSamlData(samlPayload);
      setDirectoryData(directoryPayload);
    } catch (error) {
      setLoadError((error as Error).message || "Failed to load security settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSecurityState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function handleRemoveSaml() {
    if (!teamId || !samlConnection) return;
    setRemovingSaml(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/saml`, {
        method: "DELETE",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to remove SAML configuration.");
      }

      toast.success("SAML configuration removed.");
      await Promise.all([
        refreshSecurityState(),
        mutate("/api/teams"),
        mutate(`/api/teams/${teamId}`),
      ]);
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to remove SAML configuration.",
      );
    } finally {
      setRemovingSaml(false);
    }
  }

  async function handleRemoveDirectory() {
    if (!teamId || !directory) return;
    setRemovingDirectory(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/directory-sync`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          directoryId: directory.id,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to remove directory sync.");
      }

      toast.success("Directory Sync configuration removed.");
      setLatestScimSecret(null);
      setShowScimSecret(false);

      await Promise.all([
        refreshSecurityState(),
        mutate("/api/teams"),
        mutate(`/api/teams/${teamId}`),
      ]);
    } catch (error) {
      toast.error((error as Error).message || "Failed to remove directory sync.");
    } finally {
      setRemovingDirectory(false);
    }
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Security
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure enterprise authentication and user provisioning.
            </p>
          </div>
        </div>

        {!teamId ? (
          <p className="text-sm text-muted-foreground">Select a team to continue.</p>
        ) : (
          <>
            <SAMLConfigModal
              teamId={teamId}
              open={showSamlModal}
              onOpenChange={setShowSamlModal}
              onConfigured={async () => {
                await Promise.all([
                  refreshSecurityState(),
                  mutate("/api/teams"),
                  mutate(`/api/teams/${teamId}`),
                ]);
              }}
            />

            <DirectorySyncConfigModal
              teamId={teamId}
              open={showDirectoryModal}
              onOpenChange={setShowDirectoryModal}
              onConfigured={async (directoryPayload) => {
                const payload = directoryPayload as DirectoryConnection;
                if (payload?.scim?.secret) {
                  setLatestScimSecret(payload.scim.secret);
                  setShowScimSecret(true);
                }

                await Promise.all([
                  refreshSecurityState(),
                  mutate("/api/teams"),
                  mutate(`/api/teams/${teamId}`),
                ]);
              }}
            />

            {loadError ? (
              <p className="text-sm text-red-600">{loadError}</p>
            ) : null}

            <div className="space-y-6">
              <Card className="bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    SAML Single Sign-On
                    <Badge
                      variant={samlConnection ? "preview" : "outline"}
                      className="capitalize"
                    >
                      {samlConnection ? "configured" : "not configured"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Allow your team to authenticate through an identity provider
                    like Microsoft Entra ID.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {loading ? (
                    <p className="text-muted-foreground">Loading SAML settings...</p>
                  ) : samlConnection ? (
                    <>
                      <p>
                        <span className="font-medium">Provider: </span>
                        {samlConnection.idpMetadata?.friendlyProviderName ||
                          samlConnection.idpMetadata?.provider ||
                          samlConnection.name ||
                          "Custom"}
                      </p>
                      <p>
                        <span className="font-medium">Entity ID: </span>
                        {samlData?.issuer}
                      </p>
                      <p>
                        <span className="font-medium">Reply URL (ACS): </span>
                        {samlData?.acs}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      No SAML connection configured yet.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
                  <p className="text-xs text-muted-foreground">
                    Microsoft Entra ID: set Identifier to Entity ID and Reply URL
                    to the ACS endpoint shown above.
                  </p>
                  <div className="flex items-center gap-2">
                    {samlConnection ? (
                      <Button
                        variant="outline"
                        onClick={handleRemoveSaml}
                        loading={removingSaml}
                        disabled={!isAdmin}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button onClick={() => setShowSamlModal(true)} disabled={!isAdmin}>
                        Configure
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>

              <Card className="bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Directory Sync (SCIM)
                    <Badge
                      variant={directory ? "preview" : "outline"}
                      className="capitalize"
                    >
                      {directory ? "configured" : "not configured"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Automatically provision and deprovision users and groups from
                    your IdP.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {loading ? (
                    <p className="text-muted-foreground">Loading SCIM settings...</p>
                  ) : directory ? (
                    <>
                      <p>
                        <span className="font-medium">Provider: </span>
                        {directory.type}
                      </p>
                      <div className="space-y-1">
                        <p className="font-medium">SCIM 2.0 Base URL</p>
                        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs">
                          <span className="truncate">
                            {directory.scim.endpoint || directory.scim.path}
                          </span>
                          <CopyButton
                            value={directory.scim.endpoint || directory.scim.path}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">OAuth Bearer Token</p>
                        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs">
                          <span className="truncate">
                            {displayedScimSecret
                              ? displayedScimSecret
                              : directory.scim.secret
                                ? "Hidden for security. Reveal if needed."
                                : "Token unavailable"}
                          </span>
                          {displayedScimSecret ? (
                            <CopyButton value={displayedScimSecret} />
                          ) : null}
                        </div>
                        {directory.scim.secret && !latestScimSecret ? (
                          <Button
                            variant="outline"
                            className="mt-1 h-7 px-2 text-xs"
                            onClick={() => setShowScimSecret((prev) => !prev)}
                          >
                            {showScimSecret ? "Hide token" : "Reveal token"}
                          </Button>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      No SCIM directory configured yet.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
                  <p className="text-xs text-muted-foreground">
                    In Microsoft Entra ID provisioning, use the SCIM Base URL as
                    Tenant URL and the token above as Secret Token.
                  </p>
                  <div className="flex items-center gap-2">
                    {directory ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setShowDirectoryModal(true)}
                          disabled={!isAdmin}
                        >
                          Reconfigure
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleRemoveDirectory}
                          loading={removingDirectory}
                          disabled={!isAdmin}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setShowDirectoryModal(true)}
                        disabled={!isAdmin}
                      >
                        Configure
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
