import { Dispatch, SetStateAction, useCallback, useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeTooltip } from "@/components/ui/tooltip";
import { CircleHelpIcon, PlusIcon, MoreVertical, Pencil, Trash2, SettingsIcon } from "lucide-react";
import { PresetData } from "@/pages/settings/presets";
import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { motion } from "motion/react";
import LinkItem from "@/components/links/link-sheet/link-item";
import { PlanEnum } from "@/ee/stripe/constants";
import { LinkUpgradeOptions } from "@/components/links/link-sheet/link-options";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AgreementSheet from "@/components/links/link-sheet/agreement-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import CustomFieldsPanel, { CustomFieldData } from "@/components/links/link-sheet/custom-fields-panel";
import { WatermarkConfig } from "@/lib/types";
import WatermarkConfigSheet from "@/components/links/link-sheet/watermark-panel";
import { Agreement } from "@prisma/client";
import { cn, sanitizeAllowDenyList } from "@/lib/utils";
import PlanBadge from "@/components/billing/plan-badge";
interface PresetOptionsProps {
    data: PresetData;
    setData: Dispatch<SetStateAction<PresetData>>;
    agreements: (Agreement & { _count: { links: number } })[];
};

export default function PresetOptions({ data, setData, agreements }: PresetOptionsProps) {
    const { watermarkConfig } = data;
    const [openUpgradeModal, setOpenUpgradeModal] = useState(false);
    const [trigger, setTrigger] = useState("");
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isWatermarkConfigOpen, setIsWatermarkConfigOpen] = useState(false);
    const [isAgreementSheetVisible, setIsAgreementSheetVisible] =
        useState<boolean>(false);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [upgradePlan, setUpgradePlan] = useState<PlanEnum>(PlanEnum.Business);
    const [denyListInput, setDenyListInput] = useState<string>(
        data.denyList?.join("\n") || "",
    );
    const [allowListInput, setAllowListInput] = useState<string>(
        data.allowList?.join("\n") || "",
    );

    useEffect(() => {
        if (!denyListInput) {
            setDenyListInput(data.denyList?.join("\n") || "");
        }
        if (!allowListInput) {
            setAllowListInput(data.allowList?.join("\n") || "");
        }
    }, [data.denyList, data.allowList]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const newDenyList = sanitizeAllowDenyList(denyListInput);
            const newAllowList = sanitizeAllowDenyList(allowListInput);
            setData((prevData) => ({
                ...prevData,
                denyList: newDenyList,
                allowList: newAllowList,
            }));
        }, 500);

        return () => clearTimeout(timer);
    }, [denyListInput, allowListInput, setData]);

    const handleCustomFieldsToggle = useCallback(() => {
        setData(prevData => {
            const updatedEnabled = !prevData.enableCustomFields;
            return {
                ...prevData,
                enableCustomFields: updatedEnabled,
                customFields: updatedEnabled
                    ? [
                        {
                            type: "SHORT_TEXT",
                            identifier: "",
                            label: "",
                            placeholder: "",
                            required: false,
                            disabled: false,
                            orderIndex: 0,
                        },
                    ]
                    : [],
            };
        });
    }, [setData]);

    const handleAllowListToggle = useCallback(() => {
        setData(prevData => ({
            ...prevData,
            enableAllowList: !prevData.enableAllowList,
            allowList: prevData.enableAllowList ? [] : data.allowList,
        }));
    }, [setData]);

    const handleDenyListToggle = useCallback(() => {
        setData(prevData => ({
            ...prevData,
            enableDenyList: !prevData.enableDenyList,
            denyList: prevData.enableDenyList ? [] : data.denyList,
        }));
    }, [setData]);

    const handleWatermarkToggle = useCallback(() => {
        setData(prevData => ({
            ...prevData,
            enableWatermark: !prevData.enableWatermark,
            watermarkConfig: prevData.enableWatermark ? null : data.watermarkConfig,
        }));
    }, [setData]);

    const handleToggle = useCallback((field: keyof PresetData) => {
        if (field === "enableCustomFields") {
            handleCustomFieldsToggle();
            return;
        }
        if (field === "enableAllowList") {
            handleAllowListToggle();
            return;
        }
        if (field === "enableDenyList") {
            handleDenyListToggle();
            return;
        }
        if (field === "enableWatermark") {
            handleWatermarkToggle();
            return;
        }
        setData(prevData => ({
            ...prevData,
            [field]: !prevData[field],
        }));
    }, [handleCustomFieldsToggle, handleAllowListToggle, handleDenyListToggle, setData]);

    const handleUpgradeStateChange = ({
        state,
        trigger,
        plan,
    }: LinkUpgradeOptions) => {
        setOpenUpgradeModal(state);
        setTrigger(trigger);
        if (plan) {
            setUpgradePlan(plan as PlanEnum);
        }
    };

    const handleConfigSave = useCallback((fields: CustomFieldData[]) => {
        setData(prevData => ({
            ...prevData,
            customFields: fields,
        }));
    }, [setData]);

    const handleWatermarkConfigSave = (config: WatermarkConfig) => {
        setData({
            ...data,
            watermarkConfig: config,
        });
    };

    const initialConfig: WatermarkConfig = {
        text: watermarkConfig?.text ?? "",
        isTiled: watermarkConfig?.isTiled ?? false,
        opacity: watermarkConfig?.opacity ?? 0.5,
        color: watermarkConfig?.color ?? "#000000",
        fontSize: watermarkConfig?.fontSize ?? 24,
        rotation: (watermarkConfig?.rotation ?? 45) as 0 | 30 | 45 | 90 | 180,
        position: (watermarkConfig?.position ?? "middle-center") as "top-left" | "top-center" | "top-right" | "middle-left" | "middle-center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right",
    };

    const memoizedFields = useMemo(() => data.customFields || [], [data.customFields]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Custom Fields</CardTitle>
                    <CardDescription>Add custom fields to collect additional information from viewers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LinkItem
                        title="Custom Fields"
                        tooltipContent="Add custom fields to collect additional information from viewers"
                        enabled={data.enableCustomFields}
                        action={() => handleToggle("enableCustomFields")}
                        isAllowed={true}
                        requiredPlan="business"
                        upgradeAction={() =>
                            handleUpgradeStateChange({
                                state: true,
                                trigger: "custom_fields",
                                plan: "Business",
                            })
                        }
                    />
                    {data.enableCustomFields && (
                        <motion.div
                            className="relative mt-4 space-y-3"
                            {...FADE_IN_ANIMATION_SETTINGS}
                        >
                            <div className="mt-2 flex w-full items-center justify-between">
                                <div className="space-y-1">
                                    {memoizedFields.map((field, index) => (
                                        <p
                                            key={`${field.orderIndex}-${index}`}
                                            className="text-sm text-muted-foreground"
                                        >
                                            {field.orderIndex + 1}. {field.label || "Untitled Field"}
                                            {field.required && (
                                                <span className="italic"> (required)</span>
                                            )}
                                        </p>
                                    ))}
                                </div>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsConfigOpen(true);
                                    }}
                                    variant="outline"
                                    className="h-8"
                                    size="sm"
                                >
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Configure
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    <CustomFieldsPanel
                        fields={memoizedFields}
                        onChange={handleConfigSave}
                        isConfigOpen={isConfigOpen}
                        setIsConfigOpen={setIsConfigOpen}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>NDA Requirement</CardTitle>
                        <Button
                            variant="default"
                            size="icon"
                            className="w-auto px-2"
                            onClick={() => setIsAgreementSheetVisible(true)}
                        >
                            <PlusIcon className="h-4 w-4" /> Add Agreement
                        </Button>
                    </div>
                    <CardDescription>Require viewers to accept an NDA before viewing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h2
                        className={cn(
                            "flex flex-1 cursor-pointer flex-row items-center gap-2 text-sm font-medium leading-6 text-foreground",
                        )}
                    >
                        <span>Default NDA Agreement</span>
                        <BadgeTooltip
                            content="Require viewers to accept an NDA before viewing"
                            key="link_tooltip"
                            link="https://www.papermark.com/help/article/require-nda-to-view"
                        >
                            <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
                        </BadgeTooltip>
                    </h2>
                    {agreements?.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {agreements?.map((agreement) => (
                                <Card key={agreement.id} onClick={() => {
                                    setIsAgreementSheetVisible(true);
                                    setSelectedAgreement(agreement);
                                }}>
                                    <CardContent className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col space-y-1">
                                                <Label htmlFor={agreement.id} className="cursor-pointer font-medium">
                                                    {agreement.name}
                                                </Label>
                                                <div className="text-xs text-muted-foreground">
                                                    Created on {format(
                                                        new Date(agreement.createdAt),
                                                        "MMM d, yyyy",
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="flex items-center h-fit">
                                                {agreement._count.links} links
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 flex h-24 items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/10">
                            <div className="flex flex-col items-center space-y-2 text-center">
                                <p className="text-sm text-muted-foreground">No agreements found</p>
                                <p className="text-xs text-muted-foreground">Create an agreement to require viewers to accept an NDA</p>
                            </div>
                        </div>
                    )}
                    <AgreementSheet
                        isOpen={isAgreementSheetVisible}
                        setIsOpen={setIsAgreementSheetVisible}
                        isOnlyView={!!selectedAgreement}
                        defaultData={selectedAgreement ? {
                            name: selectedAgreement.name,
                            link: selectedAgreement.content,
                            requireName: selectedAgreement.requireName,
                        } : null}
                        onClose={() => {
                            setIsAgreementSheetVisible(false);
                            setSelectedAgreement(null);
                        }}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Watermark</CardTitle>
                    <CardDescription>Apply a watermark to your documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LinkItem
                        title="Apply Watermark"
                        link="https://www.papermark.com/help/article/document-watermark"
                        tooltipContent="Add a dynamic watermark to your content."
                        enabled={data.enableWatermark}
                        action={() => handleToggle("enableWatermark")}
                        isAllowed={true}
                        requiredPlan="datarooms"
                        upgradeAction={() =>
                            handleUpgradeStateChange({
                                state: true,
                                trigger: "link_sheet_watermark_section",
                                plan: "Data Rooms",
                            })
                        }
                    />
                    {data.enableWatermark && (
                        <motion.div
                            className="relative mt-4 space-y-3"
                            {...FADE_IN_ANIMATION_SETTINGS}
                        >
                            <div className="flex w-full flex-col items-start gap-6 overflow-x-visible pt-0">
                                <div className="w-full space-y-2">
                                    <Label htmlFor="watermark-text">Watermark Text</Label>
                                    <Input
                                        id="watermark-text"
                                        type="text"
                                        name="text"
                                        placeholder="e.g. Confidential {{email}} {{date}}"
                                        value={data.watermarkConfig?.text ?? ""}
                                        required={data.enableWatermark}
                                        onChange={(e) => {
                                            setData((prevData) => ({
                                                ...prevData,
                                                watermarkConfig: {
                                                    ...(data.watermarkConfig || initialConfig),
                                                    text: e.target.value,
                                                },
                                            }));
                                        }}
                                        className="focus:ring-inset"
                                    />
                                    <div className="space-x-1 space-y-1">
                                        {["email", "date", "time", "link", "ipAddress"].map((item) => (
                                            <Button
                                                key={item}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 rounded-3xl bg-muted text-sm font-normal text-foreground/80 hover:bg-muted/70"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setData((prevData) => ({
                                                        ...prevData,
                                                        watermarkConfig: {
                                                            ...(prevData.watermarkConfig || initialConfig),
                                                            text: `${prevData.watermarkConfig?.text || ""} {{${item}}}`,
                                                        },
                                                    }));
                                                }}
                                            >{`{{${item}}}`}</Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 flex w-full items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {initialConfig.isTiled ? `tiled` : initialConfig.position},{" "}
                                    {initialConfig.rotation}º, {initialConfig.fontSize}px,{" "}
                                    {initialConfig.color.toUpperCase()},{" "}
                                    {(1 - initialConfig.opacity) * 100}% transparent
                                </p>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsWatermarkConfigOpen(true);
                                    }}
                                    variant="outline"
                                    className="h-8"
                                    size="sm"
                                >
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Configure
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    <WatermarkConfigSheet
                        isOpen={isWatermarkConfigOpen}
                        onOpenChange={setIsWatermarkConfigOpen}
                        initialConfig={initialConfig}
                        onSave={handleWatermarkConfigSave}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Viewer Access Control</CardTitle>
                    <CardDescription>Control who can access your documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LinkItem
                        title="Allow specified viewers"
                        tooltipContent="Restrict access to a selected group of viewers. Enter allowed emails or domains."
                        enabled={data.enableAllowList}
                        link="https://www.papermark.com/help/article/allow-list"
                        action={() => handleToggle("enableAllowList")}
                        isAllowed={true}
                        requiredPlan="business"
                        upgradeAction={() =>
                            handleUpgradeStateChange({
                                state: true,
                                trigger: "link_sheet_allowlist_section",
                                plan: "Business",
                            })
                        }
                    />
                    {data.enableAllowList && (
                        <motion.div
                            className="mt-1 block w-full"
                            {...FADE_IN_ANIMATION_SETTINGS}
                        >
                            <Textarea
                                className="focus:ring-inset"
                                rows={5}
                                placeholder={`Enter allowed emails/domains, one per line, e.g.
marc@papermark.io
@example.org`}
                                value={allowListInput}
                                onChange={(e) => setAllowListInput(e.target.value)}
                            />
                        </motion.div>
                    )}
                    <LinkItem
                        title="Block specified viewers"
                        tooltipContent="Prevent certain users from accessing the content. Enter blocked emails or domains."
                        enabled={data.enableDenyList}
                        link="https://www.papermark.com/help/article/block-list"
                        action={() => handleToggle("enableDenyList")}
                        isAllowed={true}
                        requiredPlan="business"
                        upgradeAction={() =>
                            handleUpgradeStateChange({
                                state: true,
                                trigger: "link_sheet_denylist_section",
                                plan: "Business",
                            })
                        }
                    />
                    {data.enableDenyList && (
                        <motion.div
                            className="mt-1 block w-full"
                            {...FADE_IN_ANIMATION_SETTINGS}
                        >
                            <Textarea
                                className="focus:ring-inset"
                                rows={5}
                                placeholder={`Enter blocked emails/domains, one per line, e.g.
marc@papermark.io
@example.org`}
                                value={denyListInput}
                                onChange={(e) => setDenyListInput(e.target.value)}
                            />
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            <UpgradePlanModal
                clickedPlan={upgradePlan}
                open={openUpgradeModal}
                setOpen={setOpenUpgradeModal}
                trigger={trigger}
            />
        </div >
    );
} 