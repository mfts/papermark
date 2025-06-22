import { useRouter } from "next/router";

import { useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { CircleHelpIcon, CrownIcon, PlusIcon } from "lucide-react";

import { usePlan } from "@/lib/swr/use-billing";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import AccessGroupsTable from "@/components/settings/access-groups-table";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeTooltip } from "@/components/ui/tooltip";

export default function AccessControl() {
  const router = useRouter();
  const { isBusiness, isDatarooms, isDataroomsPlus } = usePlan();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"allow-list" | "block-list">(
    "allow-list",
  );

  const isAllowedToCreateGroups = isBusiness || isDatarooms || isDataroomsPlus;

  const handleCreateGroup = () => {
    const type = activeTab === "allow-list" ? "ALLOW" : "BLOCK";
    router.push(`/settings/access-groups/new?type=${type}`);
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Access Control
              </h3>
              <p className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
                Manage viewer access with reusable groups
                <BadgeTooltip content="Create and manage groups for controlling who can access your links. Update once, apply everywhere.">
                  <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
                </BadgeTooltip>
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "allow-list" | "block-list")
            }
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="allow-list">Allow List Groups</TabsTrigger>
                <TabsTrigger value="block-list">Block List Groups</TabsTrigger>
              </TabsList>

              {isAllowedToCreateGroups ? (
                <Button onClick={handleCreateGroup}>
                  <PlusIcon className="mr-1.5 h-4 w-4" />
                  Create {activeTab === "allow-list" ? "Allow" : "Block"} Group
                </Button>
              ) : (
                <Button onClick={() => setShowUpgradeModal(true)}>
                  <CrownIcon className="mr-1.5 h-4 w-4" />
                  Upgrade to create groups
                </Button>
              )}
            </div>

            <TabsContent value="allow-list">
              <AccessGroupsTable
                type="allow"
                isAllowed={isAllowedToCreateGroups}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            </TabsContent>

            <TabsContent value="block-list">
              <AccessGroupsTable
                type="block"
                isAllowed={isAllowedToCreateGroups}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Upgrade Modal */}
        <UpgradePlanModal
          clickedPlan={PlanEnum.Business}
          open={showUpgradeModal}
          setOpen={setShowUpgradeModal}
          trigger="access_control_page"
        />
      </main>
    </AppLayout>
  );
}
