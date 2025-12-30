import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { useTeamSettings } from "@/lib/swr/use-team-settings";
import { validateContent } from "@/lib/utils/sanitize-html";

import { UpgradePlanModalWithDiscount } from "@/components/billing/upgrade-plan-modal-with-discount";
import AppLayout from "@/components/layouts/app";
import DeleteTeam from "@/components/settings/delete-team";
import GlobalBlockListForm from "@/components/settings/global-block-list-form";
import IgnoredDomainsForm from "@/components/settings/ignored-domains-form";
import { SettingsHeader } from "@/components/settings/settings-header";
import { TimezoneSelector } from "@/components/settings/timezone-selector";
import { Form } from "@/components/ui/form";

export default function General() {
  const analytics = useAnalytics();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { isFree, isPro, isTrial, isStarter } = usePlan();
  const [selectedPlan, setSelectedPlan] = useState<PlanEnum>(PlanEnum.Pro);
  const [planModalTrigger, setPlanModalTrigger] = useState<string>("");
  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);

  // Fetch fresh team settings with proper revalidation
  const { settings: teamSettings } = useTeamSettings(teamId);

  const showUpgradeModal = (plan: PlanEnum, trigger: string) => {
    setSelectedPlan(plan);
    setPlanModalTrigger(trigger);
    setPlanModalOpen(true);
  };

  const handleExcelAdvancedModeChange = async (data: {
    enableExcelAdvancedMode: string;
  }) => {
    if (
      (isFree || isPro || isStarter) &&
      !isTrial &&
      data.enableExcelAdvancedMode === "true"
    ) {
      showUpgradeModal(PlanEnum.Business, "advanced-excel-mode");
      return;
    }

    analytics.capture("Toggle Excel Advanced Mode", {
      teamId,
      enableExcelAdvancedMode: data.enableExcelAdvancedMode === "true",
    });

    const promise = fetch(`/api/teams/${teamId}/update-advanced-mode`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enableExcelAdvancedMode: data.enableExcelAdvancedMode === "true",
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error.message);
      }
      await Promise.all([
        mutate(`/api/teams/${teamId}`),
        mutate(`/api/teams`),
        mutate(`/api/teams/${teamId}/settings`),
      ]);
      return res.json();
    });

    toast.promise(promise, {
      loading: "Updating Excel advanced mode setting...",
      success: "Successfully updated Excel advanced mode setting!",
      error: (err) =>
        err.message || "Failed to update Excel advanced mode setting",
    });

    return promise;
  };

  const handleReplicateFoldersChange = async (data: {
    replicateDataroomFolders: string;
  }) => {
    analytics.capture("Toggle Replicate Dataroom Folders", {
      teamId,
      replicateDataroomFolders: data.replicateDataroomFolders === "true",
    });

    const promise = fetch(`/api/teams/${teamId}/update-replicate-folders`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replicateDataroomFolders: data.replicateDataroomFolders === "true",
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error.message);
      }
      await Promise.all([
        mutate(`/api/teams/${teamId}`),
        mutate(`/api/teams`),
        mutate(`/api/teams/${teamId}/settings`),
      ]);
      return res.json();
    });

    toast.promise(promise, {
      loading: "Updating folder replication setting...",
      success: "Successfully updated folder replication setting!",
      error: (err) =>
        err.message || "Failed to update folder replication setting",
    });

    return promise;
  };

  const handleTeamNameChange = async (updateData: any) => {
    try {
      // Sanitize and validate team name before sending
      const sanitizedName = validateContent(updateData.name);

      analytics.capture("Update Team Name", {
        teamId,
        name: sanitizedName,
      });

      const promise = fetch(`/api/teams/${teamId}/update-name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: sanitizedName }),
      }).then(async (res) => {
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error.message);
        }
        await Promise.all([
          mutate(`/api/teams/${teamId}`),
          mutate(`/api/teams`),
        ]);
        return res.json();
      });

      toast.promise(promise, {
        loading: "Updating team name...",
        success: "Successfully updated team name!",
        error: (err) => err.message || "Failed to update team name",
      });

      return promise;
    } catch (error) {
      toast.error((error as Error).message || "Failed to validate team name");
      throw error;
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              General
            </h3>
            <p className="text-sm text-muted-foreground">Manage your team</p>
          </div>
        </div>
        <div className="space-y-6">
          <Form
            title="Team Name"
            description="This is the name of your team on Papermark."
            inputAttrs={{
              name: "name",
              placeholder: "My Personal Team",
              maxLength: 32,
            }}
            defaultValue={teamInfo?.currentTeam?.name ?? ""}
            helpText="Max 32 characters."
            handleSubmit={handleTeamNameChange}
          />

          <Form
            title="Excel Advanced Mode"
            description="Enable advanced mode for all new Excel files in your team. Existing files will not be affected."
            inputAttrs={{
              name: "enableExcelAdvancedMode",
              type: "checkbox",
              placeholder: "Enable advanced mode for Excel files",
            }}
            defaultValue={String(
              teamSettings?.enableExcelAdvancedMode ?? false,
            )}
            helpText="When enabled, newly uploaded Excel files will be viewed using the Microsoft Office viewer for better formatting and compatibility."
            handleSubmit={handleExcelAdvancedModeChange}
            plan={(isFree && !isTrial) || isPro ? "Business" : undefined}
          />

          <Form
            title="Replicate Dataroom Folders"
            description="When uploading folders to a dataroom, also replicate the folder structure in 'All Documents'."
            inputAttrs={{
              name: "replicateDataroomFolders",
              type: "checkbox",
              placeholder: "Replicate folder structure in All Documents",
            }}
            defaultValue={String(
              teamSettings?.replicateDataroomFolders ?? true,
            )}
            helpText="When enabled, folders uploaded to datarooms will be created in 'All Documents' with the same structure. When disabled, all documents will be placed in a single folder named after the dataroom in 'All Documents'."
            handleSubmit={handleReplicateFoldersChange}
          />
          <TimezoneSelector />
          <IgnoredDomainsForm />
          <GlobalBlockListForm />

          <DeleteTeam />
        </div>

        {planModalOpen ? (
          <UpgradePlanModalWithDiscount
            clickedPlan={selectedPlan}
            trigger={planModalTrigger}
            open={planModalOpen}
            setOpen={setPlanModalOpen}
          />
        ) : null}
      </main>
    </AppLayout>
  );
}
