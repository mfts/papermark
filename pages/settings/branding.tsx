import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/context/team-context";
import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";
import { HexColorInput, HexColorPicker } from "react-colorful";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { PlusIcon } from "lucide-react";
import { useBrand } from "@/lib/swr/use-brand";
import { toast } from "sonner";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";
import { useRouter } from "next/router";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { usePlan } from "@/lib/swr/use-billing";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";

export default function Branding() {
  const { brand } = useBrand();
  const teamInfo = useTeam();
  const router = useRouter();
  const { plan } = usePlan();

  const [brandColor, setBrandColor] = useState<string>("#000000");
  const [accentColor, setAccentColor] = useState<string>("#030712");
  const [logo, setLogo] = useState<string | null>(null);

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
            setLogo(e.target?.result as string);
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
      setAccentColor(brand.accentColor || "#030712");
      setLogo(brand.logo || null);
    }
  }, [brand]);

  const saveBranding = async (e: any) => {
    e.preventDefault();

    setIsLoading(true);

    // Upload the image if it's a data URL
    let blobUrl: string | null = logo && logo.startsWith("data:") ? null : logo;
    if (logo && logo.startsWith("data:")) {
      // Convert the data URL to a blob
      const blob = convertDataUrlToFile({ dataUrl: logo });
      // Upload the blob to vercel storage
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
      <Navbar current="Branding" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Branding
            </h3>
            <p className="text-sm text-muted-foreground">
              Customize how your brand appears globally across Papermark
              documents your visitors see.
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between gap-y-4 md:gap-y-0 md:gap-x-4 w-full">
          <Card className="dark:bg-secondary min-w-max">
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="logo">
                      Logo{" "}
                      <span className="italic text-muted-foreground text-sm">
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
                              setLogo(e.target?.result as string);
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
                          className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300"
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
                      className="flex h-9 w-full rounded-md border-0 bg-background px-3 py-2 text-sm ring-1 ring-muted-foreground shadow-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-gray-300 focus:border-0"
                      color={brandColor}
                      onChange={setBrandColor}
                      prefixed
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="accent-color">Background Color</Label>
                  <div className="flex space-x-1">
                    <div
                      className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300 bg-white"
                      onClick={() => setAccentColor("#ffffff")}
                    />
                    <div
                      className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300 bg-gray-50"
                      onClick={() => setAccentColor("#f9fafb")}
                    />
                    <div
                      className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300 bg-gray-200"
                      onClick={() => setAccentColor("#e5e7eb")}
                    />
                    <div
                      className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300 bg-gray-400"
                      onClick={() => setAccentColor("#9ca3af")}
                    />
                    <div
                      className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300 bg-gray-800"
                      onClick={() => setAccentColor("#1f2937")}
                    />
                    <div
                      className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300 bg-gray-950"
                      onClick={() => setAccentColor("#030712")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              {plan && plan.plan === "free" ? (
                <UpgradePlanModal clickedPlan="Pro">
                  <Button>Upgrade to Save Branding</Button>
                </UpgradePlanModal>
              ) : (
                <Button onClick={saveBranding} loading={isLoading}>
                  Save changes
                </Button>
              )}
              {/* delete button */}
              <Button variant="link" onClick={handleDelete} disabled={!brand}>
                Reset branding
              </Button>
            </CardFooter>
          </Card>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 ">
              <TabsTrigger value="account">Links</TabsTrigger>
              <TabsTrigger value="password">Emails</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <div className="flex justify-center">
                <div className="relative w-[698px] h-[450px] p-1 rounded-lg bg-gray-200 shadow-lg">
                  <div className="rounded-lg overflow-hidden bg-gray-100 h-[442px] relative">
                    <div className="mx-auto flex items-center justify-center h-7">
                      <div className="pointer-events-none absolute left-3">
                        <div className="flex flex-row justify-start flex-nowrap">
                          <div className="pointer-events-auto">
                            <div className="inline-block size-2 mr-1 rounded-full bg-gray-300"></div>
                          </div>
                          <div className="pointer-events-auto">
                            <div className="inline-block size-2 mr-1 rounded-full bg-gray-300"></div>
                          </div>
                          <div className="pointer-events-auto">
                            <div className="inline-block size-2 mr-1 rounded-full bg-gray-300"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center rounded-xl opacity-70 w-[70%] p-1 bg-white">
                        <div
                          aria-hidden="true"
                          className="flex mt-0.5 mr-1 text-muted-foreground"
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
                          papermark.io/view/...
                        </span>
                      </div>
                    </div>
                    <iframe
                      key={`branding-${brandColor}-${accentColor}`}
                      name="checkout-demo"
                      id="checkout-demo"
                      src={`/ppreview_demo?brandColor=${encodeURIComponent(brandColor)}&accentColor=${encodeURIComponent(accentColor)}&brandLogo=${logo ? encodeURIComponent(logo) : ""}`}
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
            <TabsContent value="password">
              Change your password here.
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
