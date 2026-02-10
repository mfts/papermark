import { useCallback, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Shield, FolderSync, Info } from "lucide-react";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { DirectorySyncConfigModal } from "@/components/settings/security/directory-sync-config-modal";
import { SAMLConfigModal } from "@/components/settings/security/saml-config-modal";

export default function SecuritySettings() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [samlConnections, setSamlConnections] = useState<any[]>([]);
  const [directories, setDirectories] = useState<any[]>([]);
  const [loadingSaml, setLoadingSaml] = useState(true);
  const [loadingScim, setLoadingScim] = useState(true);

  const fetchSamlConnections = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoadingSaml(true);
      const res = await fetch(`/api/teams/${teamId}/saml`);
      if (res.ok) {
        const data = await res.json();
        setSamlConnections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch SAML connections:", error);
    } finally {
      setLoadingSaml(false);
    }
  }, [teamId]);

  const fetchDirectories = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoadingScim(true);
      const res = await fetch(`/api/teams/${teamId}/directory-sync`);
      if (res.ok) {
        const data = await res.json();
        setDirectories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch directory sync:", error);
    } finally {
      setLoadingScim(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchSamlConnections();
    fetchDirectories();
  }, [fetchSamlConnections, fetchDirectories]);

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        {/* SAML SSO Section */}
        <div className="rounded-lg border border-muted p-6 sm:p-10">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-xl font-medium">
                  SAML Single Sign-On (SSO)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Allow team members to sign in using your organization&apos;s
                  Identity Provider (IdP) such as Microsoft Entra ID, Okta, or
                  Google Workspace.
                </p>
              </div>
            </div>

            {loadingSaml ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading SAML configuration...
                </div>
              </div>
            ) : teamId ? (
              <SAMLConfigModal
                teamId={teamId}
                connections={samlConnections}
                onUpdate={fetchSamlConnections}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a team to manage SAML SSO settings.
              </div>
            )}

            {/* Help text */}
            <div className="flex items-start space-x-2 rounded-md border bg-muted/30 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">
                  Setting up SAML SSO with Microsoft Entra ID:
                </p>
                <ol className="mt-1 list-inside list-decimal space-y-1">
                  <li>
                    Create an Enterprise Application in Azure Portal
                  </li>
                  <li>
                    Configure Single Sign-On → SAML with the Entity ID and ACS
                    URL shown above
                  </li>
                  <li>
                    Copy the App Federation Metadata URL from SAML Certificates
                  </li>
                  <li>
                    Paste it in the configuration dialog above
                  </li>
                  <li>
                    Assign users and groups to the application
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Sync Section */}
        <div className="rounded-lg border border-muted p-6 sm:p-10">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <FolderSync className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-xl font-medium">
                  SCIM Directory Sync
                </h2>
                <p className="text-sm text-muted-foreground">
                  Automatically provision and deprovision team members from your
                  Identity Provider. When users are added or removed in your
                  IdP, they&apos;ll be automatically synced to this team.
                </p>
              </div>
            </div>

            {loadingScim ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading directory sync configuration...
                </div>
              </div>
            ) : teamId ? (
              <DirectorySyncConfigModal
                teamId={teamId}
                directories={directories}
                onUpdate={fetchDirectories}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a team to manage Directory Sync settings.
              </div>
            )}

            {/* Help text */}
            <div className="flex items-start space-x-2 rounded-md border bg-muted/30 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">
                  Setting up SCIM with Microsoft Entra ID:
                </p>
                <ol className="mt-1 list-inside list-decimal space-y-1">
                  <li>
                    Create a directory sync connection above to get credentials
                  </li>
                  <li>
                    In Azure Portal → Enterprise Application → Provisioning
                  </li>
                  <li>
                    Set Provisioning Mode to &quot;Automatic&quot;
                  </li>
                  <li>
                    Paste the SCIM Base URL as Tenant URL and Bearer Token as
                    Secret Token
                  </li>
                  <li>
                    Click &quot;Test Connection&quot; to verify, then Save
                  </li>
                  <li>
                    Turn provisioning Status to &quot;On&quot; and assign users
                  </li>
                </ol>
                <p className="mt-2 italic">
                  Note: Azure SCIM provisioning can take 20-40 minutes for the
                  initial sync cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
