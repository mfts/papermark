import { useRouter } from "next/router";

import { useCallback, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { Check, CircleHelpIcon, PlusIcon } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { mutate } from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import { useBrand } from "@/lib/swr/use-brand";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import { NavMenu } from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeTooltip } from "@/components/ui/tooltip";
import { UpgradeButton } from "@/components/ui/upgrade-button";

export default function Branding() {
  const teamInfo = useTeam();
  const router = useRouter();
  const { brand } = useBrand();
  const { plan, isTrial } = usePlan();

  const [brandColor, setBrandColor] = useState<string>("#000000");
  const [accentColor, setAccentColor] = useState<string>("#030712");
  const [logo, setLogo] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onChangeLogo = useCallback(
    (e: any) => {
      setFileError(null);
      const file = e.target.files[0];
      if (file) {
        if (file.size / 1024 / 1024 > 2) {
          setFileError("File size too big (max 2MB)");
        } else if (file.type !== "image/png" && file.type !== "image/jpeg") {
          setFileError("File type not supported (.png or .jpg only)");
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setLogo(dataUrl);
            // create a blob url for preview
            const blob = convertDataUrlToFile({ dataUrl });
            const blobUrl = URL.createObjectURL(blob);
            setBlobUrl(blobUrl);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [setLogo],
  );

  useEffect(() => {
    if (brand) {
      setBrandColor(brand.brandColor || "#000000");
      setAccentColor(brand.accentColor || "#FFFFFF");
      setLogo(brand.logo || null);
    }
  }, [brand]);

  const saveBranding = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    let blobUrl: string | null = logo && logo.startsWith("data:") ? null : logo;
    if (logo && logo.startsWith("data:")) {
      const blob = convertDataUrlToFile({ dataUrl: logo });
      blobUrl = await uploadImage(blob);
      setLogo(blobUrl);
    }

    const data = {
      brandColor: brandColor,
      accentColor: accentColor,

      logo: blobUrl,
    };

    const res = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/branding`,
      {
        method: brand ? "PUT" : "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (res.ok) {
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/branding`);
      setIsLoading(false);
      toast.success("Branding updated successfully");
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/branding`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (res.ok) {
      setLogo(null);
      setBrandColor("#000000");
      setAccentColor("#030712");
      setIsLoading(false);
      toast.success("Branding reset successfully");
      router.reload();
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Branding
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Customize how your brand appears globally across Papermark
                documents your visitors see.
              </p>
            </div>
          </section>

          <NavMenu
            navigation={[
              {
                label: "Document Branding",
                href: "/branding",
                segment: `branding`,
              },
              {
                label: "Domains",
                href: "/settings/domains",
                segment: "domains",
              },
              {
                label: "Link Previews",
                href: "/settings/presets",
                segment: "presets",
              },
            ]}
          />
        </header>
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Document Branding
              </h3>
              <p className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
                All direct links to documents will have your branding applied.
                <span className="italic">
                  Data rooms are styled individually.
                </span>
                <BadgeTooltip
                  linkText="Click here"
                  content="How to customize document branding?"
                  key="branding"
                  link="https://www.papermark.com/help/article/document-branding"
                >
                  <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
                </BadgeTooltip>
              </p>
            </div>
          </div>
          <div>
            <Card className="dark:bg-secondary">
              <div className="flex w-full flex-col justify-between gap-y-4 md:flex-row md:gap-x-4 md:gap-y-0">
                <Card className="min-w-max dark:bg-secondary">
                  <CardContent className="pt-6">
                    <div className="grid gap-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="logo">
                            Logo{" "}
                            <span className="text-sm italic text-muted-foreground">
                              (max 2 MB)
                            </span>
                          </Label>
                          {fileError ? (
                            <p className="text-sm text-red-500">{fileError}</p>
                          ) : null}
                        </div>
                        <label
                          htmlFor="image"
                          className="group relative mt-1 flex h-[4rem] w-[12rem] cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
                        >
                          {false && (
                            <div className="absolute z-[5] flex h-full w-full items-center justify-center rounded-md bg-white">
                              <LoadingSpinner />
                            </div>
                          )}
                          <div
                            className="absolute z-[5] h-full w-full rounded-md"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragActive(true);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragActive(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragActive(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragActive(false);
                              setFileError(null);
                              const file =
                                e.dataTransfer.files && e.dataTransfer.files[0];
                              if (file) {
                                if (file.size / 1024 / 1024 > 2) {
                                  setFileError("File size too big (max 2MB)");
                                } else if (
                                  file.type !== "image/png" &&
                                  file.type !== "image/jpeg"
                                ) {
                                  setFileError(
                                    "File type not supported (.png or .jpg only)",
                                  );
                                } else {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    const dataUrl = e.target?.result as string;
                                    setLogo(dataUrl);
                                    // create a blob url for preview
                                    const blob = convertDataUrlToFile({
                                      dataUrl,
                                    });
                                    const blobUrl = URL.createObjectURL(blob);
                                    setBlobUrl(blobUrl);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                          />
                          <div
                            className={`${
                              dragActive
                                ? "cursor-copy border-2 border-black bg-gray-50 opacity-100"
                                : ""
                            } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md bg-white transition-all ${
                              logo
                                ? "opacity-0 group-hover:opacity-100"
                                : "group-hover:bg-gray-50"
                            }`}
                          >
                            <PlusIcon
                              className={`${
                                dragActive ? "scale-110" : "scale-100"
                              } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
                            />
                            <span className="sr-only">OG image upload</span>
                          </div>
                          {logo && (
                            <img
                              src={logo}
                              alt="Preview"
                              className="h-full w-full rounded-md object-contain"
                            />
                          )}
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="sr-only"
                            onChange={onChangeLogo}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="primary-color">Brand Color</Label>
                        <div className="flex space-x-1">
                          <Popover>
                            <PopoverTrigger>
                              <div
                                className="h-9 w-9 cursor-pointer rounded-md shadow-sm ring-1 ring-muted-foreground hover:ring-1 hover:ring-gray-300"
                                style={{ backgroundColor: brandColor }}
                              />
                            </PopoverTrigger>
                            <PopoverContent>
                              <HexColorPicker
                                color={brandColor}
                                onChange={setBrandColor}
                              />
                            </PopoverContent>
                          </Popover>
                          <HexColorInput
                            className="flex h-9 w-full rounded-md border-0 bg-background px-3 py-2 text-sm shadow-sm ring-1 ring-muted-foreground placeholder:text-muted-foreground focus:border-0 focus:ring-1 focus:ring-gray-300"
                            color={brandColor}
                            onChange={setBrandColor}
                            prefixed
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="accent-color">Background Color</Label>
                        <div className="flex space-x-1">
                          <Popover>
                            <PopoverTrigger>
                              <div
                                className="h-9 w-9 cursor-pointer rounded-md shadow-sm ring-1 ring-muted-foreground hover:ring-1 hover:ring-gray-300"
                                style={{ backgroundColor: accentColor }}
                              />
                            </PopoverTrigger>
                            <PopoverContent>
                              <HexColorPicker
                                color={accentColor}
                                onChange={setAccentColor}
                              />
                            </PopoverContent>
                          </Popover>
                          <HexColorInput
                            className="flex h-9 w-full rounded-md border-0 bg-background px-3 py-2 text-sm shadow-sm ring-1 ring-muted-foreground placeholder:text-muted-foreground focus:border-0 focus:ring-1 focus:ring-gray-300"
                            color={accentColor}
                            onChange={setAccentColor}
                            prefixed
                          />
                        </div>
                        <div className="mt-2 flex space-x-1">
                          <div
                            className="relative h-9 w-9 cursor-pointer rounded-md bg-white shadow-sm ring-1 ring-muted-foreground hover:ring-gray-300"
                            onClick={() => setAccentColor("#ffffff")}
                          >
                            {accentColor === "#ffffff" && (
                              <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gray-600" />
                            )}
                          </div>
                          <div
                            className="relative h-9 w-9 cursor-pointer rounded-md bg-gray-50 shadow-sm ring-1 ring-muted-foreground hover:ring-gray-300"
                            onClick={() => setAccentColor("#f9fafb")}
                          >
                            {accentColor === "#f9fafb" && (
                              <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gray-600" />
                            )}
                          </div>
                          <div
                            className="relative h-9 w-9 cursor-pointer rounded-md bg-gray-200 shadow-sm ring-1 ring-muted-foreground hover:ring-gray-300"
                            onClick={() => setAccentColor("#e5e7eb")}
                          >
                            {accentColor === "#e5e7eb" && (
                              <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gray-600" />
                            )}
                          </div>
                          <div
                            className="relative h-9 w-9 cursor-pointer rounded-md bg-gray-400 shadow-sm ring-1 ring-muted-foreground hover:ring-gray-300"
                            onClick={() => setAccentColor("#9ca3af")}
                          >
                            {accentColor === "#9ca3af" && (
                              <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                            )}
                          </div>
                          <div
                            className="relative h-9 w-9 cursor-pointer rounded-md bg-gray-800 shadow-sm ring-1 ring-muted-foreground hover:ring-gray-300"
                            onClick={() => setAccentColor("#1f2937")}
                          >
                            {accentColor === "#1f2937" && (
                              <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                            )}
                          </div>
                          <div
                            className="relative h-9 w-9 cursor-pointer rounded-md bg-gray-950 shadow-sm ring-1 ring-muted-foreground hover:ring-gray-300"
                            onClick={() => setAccentColor("#030712")}
                          >
                            {accentColor === "#030712" && (
                              <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t p-6">
                    {plan === "free" && !isTrial ? (
                      <UpgradeButton
                        text="Save Branding"
                        clickedPlan={PlanEnum.Pro}
                        trigger="branding_page"
                        highlightItem={["custom-branding"]}
                      />
                    ) : (
                      <Button onClick={saveBranding} loading={isLoading}>
                        Save changes
                      </Button>
                    )}
                    {/* delete button */}
                    <Button
                      variant="link"
                      onClick={handleDelete}
                      disabled={!brand}
                    >
                      Reset branding
                    </Button>
                  </CardFooter>
                </Card>
                <Tabs defaultValue="document-view" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="document-view">
                      Document View
                    </TabsTrigger>
                    <TabsTrigger value="front-page">Front page</TabsTrigger>
                  </TabsList>
                  <TabsContent value="document-view">
                    <div className="flex justify-center">
                      <div className="relative h-[450px] w-[698px] rounded-lg bg-gray-200 p-1 shadow-lg">
                        <div className="relative h-[442px] overflow-x-auto rounded-lg bg-gray-100 lg:overflow-x-hidden">
                          <div className="mx-auto flex h-7 items-center justify-center">
                            <div className="pointer-events-none absolute left-3">
                              <div className="flex flex-row flex-nowrap justify-start">
                                <div className="pointer-events-auto">
                                  <div className="mr-1 inline-block size-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div className="pointer-events-auto">
                                  <div className="mr-1 inline-block size-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div className="pointer-events-auto">
                                  <div className="mr-1 inline-block size-2 rounded-full bg-gray-300"></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex w-[70%] items-center justify-center rounded-xl bg-white p-1 opacity-70">
                              <div
                                aria-hidden="true"
                                className="mr-1 mt-0.5 flex text-muted-foreground"
                              >
                                <svg
                                  aria-hidden="true"
                                  height="8"
                                  width="8"
                                  viewBox="0 0 16 16"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M8.75 11.25a1.25 1.25 0 1 0-1.5 0v1a.75.75 0 0 0 1.5 0v-1Z"></path>
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M3.5 4v2h-1a1 1 0 0 0-1 1v6a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3V7a1 1 0 0 0-1-1h-1V4a4 4 0 0 0-4-4h-1a4 4 0 0 0-4 4ZM11 6V4a2.5 2.5 0 0 0-2.5-2.5h-1A2.5 2.5 0 0 0 5 4v2h6Zm-8 7V7.5h10V13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13Z"
                                  ></path>
                                </svg>
                              </div>
                              <span className="whitespace-normal text-xs text-muted-foreground">
                                papermark.com/view/...
                              </span>
                            </div>
                          </div>
                          <iframe
                            key={`document-view-${brandColor}-${accentColor}`}
                            name="document-view"
                            id="document-view"
                            src={`/nav_ppreview_demo?brandColor=${encodeURIComponent(brandColor)}&accentColor=${encodeURIComponent(accentColor)}&brandLogo=${blobUrl ? encodeURIComponent(blobUrl) : logo ? encodeURIComponent(logo) : ""}`}
                            style={{
                              width: "1390px",
                              height: "831px",
                              transform: "scale(0.497)",
                              transformOrigin: "left top",
                              background: "rgb(255, 255, 255)",
                              position: "absolute",
                              top: "0px",
                              left: "0px",
                              borderTop: "none",
                              borderRight: "0px",
                              borderBottom: "0px",
                              borderLeft: "0px",
                              borderImage: "initial",
                              overflow: "hidden",
                              pointerEvents: "none",
                              borderBottomLeftRadius: "8px",
                              borderBottomRightRadius: "8px",
                              marginTop: "29px",
                            }}
                          ></iframe>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="front-page">
                    <div className="flex justify-center">
                      <div className="relative h-[450px] w-[698px] rounded-lg bg-gray-200 p-1 shadow-lg">
                        <div className="relative h-[442px] overflow-x-auto rounded-lg bg-gray-100 lg:overflow-x-hidden">
                          <div className="mx-auto flex h-7 items-center justify-center">
                            <div className="pointer-events-none absolute left-3">
                              <div className="flex flex-row flex-nowrap justify-start">
                                <div className="pointer-events-auto">
                                  <div className="mr-1 inline-block size-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div className="pointer-events-auto">
                                  <div className="mr-1 inline-block size-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div className="pointer-events-auto">
                                  <div className="mr-1 inline-block size-2 rounded-full bg-gray-300"></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex w-[70%] items-center justify-center rounded-xl bg-white p-1 opacity-70">
                              <div
                                aria-hidden="true"
                                className="mr-1 mt-0.5 flex text-muted-foreground"
                              >
                                <svg
                                  aria-hidden="true"
                                  height="8"
                                  width="8"
                                  viewBox="0 0 16 16"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M8.75 11.25a1.25 1.25 0 1 0-1.5 0v1a.75.75 0 0 0 1.5 0v-1Z"></path>
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M3.5 4v2h-1a1 1 0 0 0-1 1v6a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3V7a1 1 0 0 0-1-1h-1V4a4 4 0 0 0-4-4h-1a4 4 0 0 0-4 4ZM11 6V4a2.5 2.5 0 0 0-2.5-2.5h-1A2.5 2.5 0 0 0 5 4v2h6Zm-8 7V7.5h10V13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13Z"
                                  ></path>
                                </svg>
                              </div>
                              <span className="whitespace-normal text-xs text-muted-foreground">
                                papermark.com/view/...
                              </span>
                            </div>
                          </div>
                          <iframe
                            key={`access-screen-${accentColor}`}
                            name="access-screen"
                            id="access-screen"
                            src={`/entrance_ppreview_demo?accentColor=${encodeURIComponent(accentColor)}`}
                            style={{
                              width: "1390px",
                              height: "831px",
                              transform: "scale(0.497)",
                              transformOrigin: "left top",
                              background: "rgb(255, 255, 255)",
                              position: "absolute",
                              top: "0px",
                              left: "0px",
                              borderTop: "none",
                              borderRight: "0px",
                              borderBottom: "0px",
                              borderLeft: "0px",
                              borderImage: "initial",
                              overflow: "hidden",
                              pointerEvents: "none",
                              borderBottomLeftRadius: "8px",
                              borderBottomRightRadius: "8px",
                              marginTop: "29px",
                            }}
                          ></iframe>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
