import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { Agreement, CustomFieldType, LinkPreset } from "@prisma/client";
import { CircleHelpIcon, Loader2, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import Preview from "@/components/settings/og-preview";
import SocialMediaCardPreset from "@/components/settings/presets/social-media-card-preset";
import PresetOptions from "@/components/settings/presets/preset-options";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { BadgeTooltip } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { usePlan } from "@/lib/swr/use-billing";
import {
  convertDataUrlToFile,
  fetcher,
  sanitizeAllowDenyList,
  uploadImage,
} from "@/lib/utils";
import { CustomFieldData } from "@/components/links/link-sheet/custom-fields-panel";
import { useAgreements } from "@/lib/swr/use-agreements";

export interface PresetData {
  enableCustomMetaTag: boolean;
  name: string;
  metaFavicon: string | null;
  metaImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;

  enableCustomFields: boolean;
  customFields: CustomFieldData[] | null;

  enableWatermark: boolean;
  watermarkConfig: {
    text: string;
    isTiled: boolean;
    color: string;
    fontSize: number;
    opacity: number;
    rotation: number;
    position: string;
  } | null;

  enableAllowList: boolean;
  allowList: string[];
  enableDenyList: boolean;
  denyList: string[];
}

export const defaultPresetData: PresetData = {
  enableCustomMetaTag: false,
  name: "",
  metaFavicon: null,
  metaImage: null,
  metaTitle: null,
  metaDescription: null,

  enableCustomFields: false,
  customFields: null,

  enableWatermark: false,
  watermarkConfig: null,

  enableAllowList: false,
  allowList: [],
  enableDenyList: false,
  denyList: []
};

export default function Presets() {
  const teamInfo = useTeam();
  const { plan, isTrial } = usePlan();
  const [isLoading, setIsLoading] = useState(false);
  const { agreements } = useAgreements();
  const { data: presets, mutate: mutatePreset } = useSWRImmutable<LinkPreset>(
    `/api/teams/${teamInfo?.currentTeam?.id}/presets`,
    fetcher,
  );
  const [data, setData] = useState<PresetData>(defaultPresetData);
  const [activeTab, setActiveTab] = useState("social-media");

  const filteredAgreements = agreements.filter((agreement: Agreement) => !agreement.deletedAt);
  useEffect(() => {
    if (presets) {
      const customFields = presets.customFields ? JSON.parse(presets.customFields as string) as PresetData['customFields'] : null;
      const watermarkConfig = presets.watermarkConfig ? JSON.parse(presets.watermarkConfig as string) as PresetData['watermarkConfig'] : null;

      setData({
        name: presets.name,
        metaFavicon: presets.metaFavicon,
        metaImage: presets.metaImage,
        metaTitle: presets.metaTitle,
        metaDescription: presets.metaDescription,
        enableCustomMetaTag: presets.enableCustomMetaTag || false,
        enableCustomFields: presets.enableCustomFields || false,
        customFields: customFields,
        enableWatermark: presets.enableWatermark || false,
        watermarkConfig: watermarkConfig,
        enableAllowList: presets.enableAllowList || false,
        allowList: presets.allowList,
        enableDenyList: presets.enableDenyList || false,
        denyList: presets.denyList
      });
    }
  }, [presets]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isPresetEmpty =
      !data.enableCustomFields &&
      !data.enableWatermark &&
      !data.enableAllowList &&
      !data.enableDenyList;

    const method = isPresetEmpty ? "DELETE" : "PUT";

    const payload = isPresetEmpty
      ? null
      : {
        ...data,
        watermarkConfig: data.watermarkConfig || null,
        metaImage: null,
        metaTitle: null,
        metaDescription: null,
        metaFavicon: null,
        enableCustomMetaTag: false,
      };

    try {
      const response = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/presets`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${method.toLowerCase()} preset`);
      }

      if (method === "DELETE") {
        setData(defaultPresetData);
      } else {
        setData(prev => ({
          ...prev,
          metaImage: null,
          metaTitle: null,
          metaDescription: null,
          metaFavicon: null,
          enableCustomMetaTag: false,
        }));
      }


      toast.success("Your Social Media preset has been successfully reset");
    } catch (error) {
      console.error("Error resetting preset:", error);
      toast.error(
        `Failed to reset preset: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      if (method === "DELETE") {
        await mutatePreset(undefined, false);
      } else {
        await mutatePreset();
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isMetaDataPresent =
      data.enableCustomMetaTag ||
      !!(data.metaTitle || data.metaDescription || data.metaImage || data.metaFavicon);

    const isPresetEmpty =
      !isMetaDataPresent &&
      !data.enableCustomFields &&
      !data.enableWatermark &&
      !data.enableAllowList &&
      !data.enableDenyList;

    const method = isPresetEmpty
      ? "DELETE"
      : presets?.id
        ? "PUT"
        : "POST";
    const payload = !isPresetEmpty
      ? {
        ...data,
        enableCustomMetaTag: isMetaDataPresent,
        customFields: data.customFields || null,
        watermarkConfig: data.watermarkConfig || null,
      }
      : null;

    try {
      const response = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/presets`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });

      if (!response.ok) throw new Error("Failed to save preset");

      const successMessage =
        method === "PUT"
          ? "Your preset has been updated successfully"
          : method === "POST"
            ? "Your preset has been created successfully"
            : "Your preset has been removed successfully";

      toast.success(successMessage);
    } catch (error) {
      toast.error("Failed to save preset");
    } finally {
      if (method === "DELETE") {
        await mutatePreset(undefined, false);
      } else {
        await mutatePreset();
      }
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="flex flex-row items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                Link Presets
              </h3>
              <p className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
                Configure your default link settings.
                <BadgeTooltip
                  content="Customize how your content appears when shared on social media."
                  key="verified"
                  link="https://www.papermark.com/help/article/change-social-media-cards"
                >
                  <CircleHelpIcon className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground" />
                </BadgeTooltip>
              </p>
            </div>
          </div>

          <Tabs defaultValue="social-media" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="social-media">Social Media</TabsTrigger>
                <TabsTrigger value="access-control">Link Presets</TabsTrigger>
              </TabsList>

              {activeTab === "access-control" && (
                <Button
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleSubmit}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> <span>Saving...</span></> : <>
                    <PlusIcon className="h-4 w-4" />
                    <span>Save Preset</span></>
                  }
                </Button>
              )}
            </div>

            <TabsContent value="social-media">
              <div className="grid w-full divide-x divide-border overflow-auto scrollbar-hide md:grid-cols-2 md:overflow-hidden">
                <div className="px-4 scrollbar-hide md:max-h-[95svh] md:overflow-auto">
                  <div className="sticky top-0 z-10 flex h-10 items-center justify-center border-b border-border bg-white px-5 dark:bg-gray-900 sm:h-14">
                    <h2 className="text-lg font-medium">Social Media Card</h2>
                  </div>

                  <SocialMediaCardPreset data={data} setData={setData} />

                  <div className="flex justify-end px-5 py-4">
                    {(plan === "free" || plan === "pro") && !isTrial ? (
                      <UpgradePlanModal
                        clickedPlan={PlanEnum.Business}
                        trigger={"presets_page"}
                      >
                        <Button>Upgrade to Save Preset</Button>
                      </UpgradePlanModal>
                    ) : (
                      <Button onClick={handleSubmit} loading={isLoading}>
                        Save Social Media Preset
                      </Button>
                    )}

                    {data.enableCustomMetaTag ? (
                      <Button
                        variant="link"
                        onClick={handleDelete}
                        className="ml-2"
                        loading={isLoading}
                      >
                        Reset Social Media Preset
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="px-4 scrollbar-hide md:max-h-[95svh] md:overflow-auto">
                  <Preview data={data} setData={setData} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="access-control">
              <div className="grid w-full gap-6">
                <PresetOptions
                  data={data}
                  setData={setData}
                  agreements={filteredAgreements}
                  teamId={teamInfo?.currentTeam?.id!}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
}

