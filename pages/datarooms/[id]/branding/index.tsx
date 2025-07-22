import { useRouter } from "next/router";

import { useCallback, useEffect, useState, useRef } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { useTeam } from "@/context/team-context";
import { Check, CircleHelpIcon, InfoIcon, PlusIcon, X } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { mutate } from "swr";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import AppLayout from "@/components/layouts/app";
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

import { useDataroomBrand } from "@/lib/swr/use-brand";
import { useDataroom } from "@/lib/swr/use-dataroom";
import { cn, convertDataUrlToFile, uploadImage } from "@/lib/utils";

const DEFAULT_BANNER_IMAGE = "/_static/papermark-banner.png";

export default function DataroomBrandPage() {
  const router = useRouter();
  const teamInfo = useTeam();
  const { dataroom } = useDataroom();
  const { brand } = useDataroomBrand({ dataroomId: dataroom?.id });

  const [brandColor, setBrandColor] = useState<string>("#000000");
  const [accentColor, setAccentColor] = useState<string>("#FFFFFF");
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(DEFAULT_BANNER_IMAGE);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [bannerBlobUrl, setBannerBlobUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Image cropping states - Logo
  const [showLogoCropper, setShowLogoCropper] = useState(false);
  const [logoImageToCrop, setLogoImageToCrop] = useState<string>("");
  const [logoCrop, setLogoCrop] = useState<Crop>();
  const [logoCompletedCrop, setLogoCompletedCrop] = useState<PixelCrop>();
  const logoImgRef = useRef<HTMLImageElement>(null);
  const logoPreviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Image cropping states - Banner
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  const [bannerImageToCrop, setBannerImageToCrop] = useState<string>("");
  const [bannerCrop, setBannerCrop] = useState<Crop>();
  const [bannerCompletedCrop, setBannerCompletedCrop] = useState<PixelCrop>();
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const bannerPreviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Utility functions for cropping
  const centerAspectCrop = useCallback((mediaWidth: number, mediaHeight: number, aspect: number) => {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }, []);

  const canvasPreview = useCallback(async (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop,
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    );
    ctx.restore();
  }, []);

  // Handle logo crop completion
  useEffect(() => {
    if (
      logoCompletedCrop?.width &&
      logoCompletedCrop?.height &&
      logoImgRef.current &&
      logoPreviewCanvasRef.current
    ) {
      canvasPreview(logoImgRef.current, logoPreviewCanvasRef.current, logoCompletedCrop);
    }
  }, [logoCompletedCrop, canvasPreview]);

  // Handle banner crop completion
  useEffect(() => {
    if (
      bannerCompletedCrop?.width &&
      bannerCompletedCrop?.height &&
      bannerImgRef.current &&
      bannerPreviewCanvasRef.current
    ) {
      canvasPreview(bannerImgRef.current, bannerPreviewCanvasRef.current, bannerCompletedCrop);
    }
  }, [bannerCompletedCrop, canvasPreview]);

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
            setLogoImageToCrop(dataUrl);
            setShowLogoCropper(true);
          };
          reader.readAsDataURL(file);
        }
      }
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    },
    [],
  );

  const onChangeBanner = useCallback(
    (e: any) => {
      setFileError(null);
      const file = e.target.files[0];
      if (file) {
        if (file.size / 1024 / 1024 > 5) {
          setFileError("File size too big (max 5MB)");
        } else if (file.type !== "image/png" && file.type !== "image/jpeg") {
          setFileError("File type not supported (.png or .jpg only)");
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setBannerImageToCrop(dataUrl);
            setShowBannerCropper(true);
          };
          reader.readAsDataURL(file);
        }
      }
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    },
    [],
  );

  useEffect(() => {
    if (brand) {
      setBrandColor(brand.brandColor || "#000000");
      setAccentColor(brand.accentColor || "#FFFFFF");
      setLogo(brand.logo || null);
      setBanner(brand.banner || DEFAULT_BANNER_IMAGE);
    }
  }, [brand]);

  // Logo cropping handlers
  const handleLogoImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setLogoCrop(centerAspectCrop(width, height, 1)); // Square aspect ratio for logo
  }, [centerAspectCrop]);

  const handleLogoCropComplete = useCallback(() => {
    if (!logoPreviewCanvasRef.current) {
      return;
    }

    logoPreviewCanvasRef.current.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to process image");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setLogo(dataUrl);
        // create a blob url for preview
        const blob = convertDataUrlToFile({ dataUrl });
        const blobUrl = URL.createObjectURL(blob);
        setBlobUrl(blobUrl);
        setShowLogoCropper(false);
        setLogoImageToCrop("");
        setLogoCrop(undefined);
        setLogoCompletedCrop(undefined);
      };
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleLogoCropCancel = useCallback(() => {
    setShowLogoCropper(false);
    setLogoImageToCrop("");
    setLogoCrop(undefined);
    setLogoCompletedCrop(undefined);
  }, []);

  // Banner cropping handlers
  const handleBannerImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setBannerCrop(centerAspectCrop(width, height, 6)); // 6:1 aspect ratio for banner (1920x320)
  }, [centerAspectCrop]);

  const handleBannerCropComplete = useCallback(() => {
    if (!bannerPreviewCanvasRef.current) {
      return;
    }

    bannerPreviewCanvasRef.current.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to process image");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setBanner(dataUrl);
        // create a blob url for preview
        const blob = convertDataUrlToFile({ dataUrl });
        const bannerBlobUrl = URL.createObjectURL(blob);
        setBannerBlobUrl(bannerBlobUrl);
        setShowBannerCropper(false);
        setBannerImageToCrop("");
        setBannerCrop(undefined);
        setBannerCompletedCrop(undefined);
      };
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleBannerCropCancel = useCallback(() => {
    setShowBannerCropper(false);
    setBannerImageToCrop("");
    setBannerCrop(undefined);
    setBannerCompletedCrop(undefined);
  }, []);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

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

    let bannerBlobUrl: string | null =
      banner && banner.startsWith("data:") ? null : banner;
    if (banner && banner.startsWith("data:")) {
      // Convert the data URL to a blob
      const blob = convertDataUrlToFile({ dataUrl: banner });
      // Upload the blob to vercel storage
      bannerBlobUrl = await uploadImage(blob);
      setBanner(bannerBlobUrl);
    }

    const data = {
      brandColor: brandColor,
      accentColor: accentColor,
      logo: blobUrl,
      banner: bannerBlobUrl,
    };

    const res = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroom.id}/branding`,
      {
        method: brand ? "PUT" : "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (res.ok) {
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroom.id}/branding`,
      );
      setIsLoading(false);
      toast.success("Branding updated successfully");
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    const res = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroom.id}/branding`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (res.ok) {
      setLogo(null);
      setBanner(DEFAULT_BANNER_IMAGE);
      setBrandColor("#000000");
      setIsLoading(false);
      toast.success("Branding reset successfully");
      router.reload();
    }
  };

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Branding
            </h3>
            <p className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
              Customize your data room&apos;s branding for a cohesive user
              experience.
              <BadgeTooltip
                linkText="Click here"
                content="How to customize data room branding?"
                key="branding"
                link="https://www.papermark.com/help/article/dataroom-branding"
              >
                <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
              </BadgeTooltip>
            </p>
          </div>
        </div>
        <div className="space-y-4">
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
                                    setLogoImageToCrop(dataUrl);
                                    setShowLogoCropper(true);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                          />
                          <div
                            className={cn(
                              "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md bg-white transition-all",
                              dragActive &&
                                "cursor-copy border-2 border-black bg-gray-50 opacity-100",
                              logo
                                ? "opacity-0 group-hover:opacity-100"
                                : "group-hover:bg-gray-50",
                            )}
                          >
                            <PlusIcon
                              className={cn(
                                "h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95",
                                dragActive ? "scale-110" : "scale-100",
                              )}
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
                      {/* Banner Input */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="banner">
                            Banner{" "}
                            <span className="text-sm italic text-muted-foreground">
                              (max 5 MB, min. 1920x320)
                            </span>
                          </Label>
                          {fileError ? (
                            <p className="text-sm text-red-500">{fileError}</p>
                          ) : null}
                        </div>
                        <label
                          htmlFor="banner"
                          className="group relative mt-1 flex h-[4rem] w-[12rem] cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%)",
                            backgroundSize: "20px 20px",
                            backgroundPosition:
                              "0 0, 10px 0, 10px -10px, 0px 10px",
                          }}
                        >
                          {false && (
                            <div className="absolute z-[5] flex h-full w-full items-center justify-center rounded-md bg-white">
                              <LoadingSpinner />
                            </div>
                          )}
                          <div
                            className={cn(
                              "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md bg-white transition-all",
                              dragActive &&
                                "cursor-copy border-2 border-black bg-gray-50 opacity-100",
                              banner
                                ? "opacity-0 group-hover:opacity-100"
                                : "group-hover:bg-gray-50",
                            )}
                          >
                            <PlusIcon
                              className={cn(
                                "h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95",
                                dragActive ? "scale-110" : "scale-100",
                              )}
                            />
                            <span className="sr-only">Banner image upload</span>
                          </div>
                          {banner && (
                            <img
                              src={banner}
                              alt="Preview"
                              className="h-full w-full rounded-md object-contain"
                            />
                          )}
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            id="banner"
                            name="banner"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="sr-only"
                            onChange={onChangeBanner}
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
                        <Label htmlFor="accent-color">
                          Background Color
                          <span className="ml-2 text-sm text-muted-foreground">
                            (front page)
                          </span>
                        </Label>
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
                    <Button onClick={saveBranding} loading={isLoading}>
                      Save changes
                    </Button>

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
                <Tabs defaultValue="dataroom-view" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dataroom-view">
                      Dataroom View
                    </TabsTrigger>
                    <TabsTrigger value="document-view">
                      Document View
                    </TabsTrigger>
                    <TabsTrigger value="access-view">Front Page</TabsTrigger>
                  </TabsList>
                  {/* Dataroom View */}
                  <TabsContent value="dataroom-view">
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
                                papermark.com/dataroom/...
                              </span>
                            </div>
                          </div>
                          <iframe
                            key={`dataroom-view-${brandColor}-${accentColor}`}
                            name="dataroom-view"
                            id="dataroom-view"
                            src={`/room_ppreview_demo?brandColor=${encodeURIComponent(brandColor)}&accentColor=${encodeURIComponent(accentColor)}&brandLogo=${blobUrl ? encodeURIComponent(blobUrl) : logo ? encodeURIComponent(logo) : ""}&brandBanner=${bannerBlobUrl ? encodeURIComponent(bannerBlobUrl) : banner ? encodeURIComponent(banner) : ""}`}
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
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  {/* Document View */}
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
                  <TabsContent value="access-view">
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
                            key={`access-screen-${brandColor}-${accentColor}`}
                            name="access-screen"
                            id="access-screen"
                            src={`/entrance_ppreview_demo?brandColor=${encodeURIComponent(brandColor)}&accentColor=${encodeURIComponent(accentColor)}&brandLogo=${blobUrl ? encodeURIComponent(blobUrl) : logo ? encodeURIComponent(logo) : ""}`}
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

        {/* Logo Cropper Modal */}
        {showLogoCropper && logoImageToCrop && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Crop Logo</h3>
                  <Button variant="ghost" size="sm" onClick={handleLogoCropCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <ReactCrop
                      crop={logoCrop}
                      onChange={(_, percentCrop) => setLogoCrop(percentCrop)}
                      onComplete={(c) => {
                        if (logoImgRef.current) {
                          setLogoCompletedCrop(
                            convertToPixelCrop(c, logoImgRef.current.width, logoImgRef.current.height)
                          );
                        }
                      }}
                      aspect={1} // Square aspect ratio for logos
                      minWidth={100}
                      minHeight={100}
                      className="max-w-full"
                    >
                      <img
                        ref={logoImgRef}
                        alt="Crop logo"
                        src={logoImageToCrop}
                        onLoad={handleLogoImageLoad}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "60vh",
                        }}
                      />
                    </ReactCrop>
                  </div>

                  {logoCompletedCrop && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="text-center">
                          <h4 className="text-sm font-medium mb-2">Preview:</h4>
                          <canvas
                            ref={logoPreviewCanvasRef}
                            className="border rounded max-w-full h-auto mx-auto"
                            style={{
                              objectFit: "contain",
                              width: Math.min(logoCompletedCrop.width, 200),
                              height: Math.min(logoCompletedCrop.height, 200),
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleLogoCropComplete}>
                          Apply Crop
                        </Button>
                        <Button variant="outline" onClick={handleLogoCropCancel}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Banner Cropper Modal */}
        {showBannerCropper && bannerImageToCrop && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Crop Banner</h3>
                  <Button variant="ghost" size="sm" onClick={handleBannerCropCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <ReactCrop
                      crop={bannerCrop}
                      onChange={(_, percentCrop) => setBannerCrop(percentCrop)}
                      onComplete={(c) => {
                        if (bannerImgRef.current) {
                          setBannerCompletedCrop(
                            convertToPixelCrop(c, bannerImgRef.current.width, bannerImgRef.current.height)
                          );
                        }
                      }}
                      aspect={6} // 6:1 aspect ratio for banners (1920x320)
                      minWidth={320}
                      minHeight={53}
                      className="max-w-full"
                    >
                      <img
                        ref={bannerImgRef}
                        alt="Crop banner"
                        src={bannerImageToCrop}
                        onLoad={handleBannerImageLoad}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "60vh",
                        }}
                      />
                    </ReactCrop>
                  </div>

                  {bannerCompletedCrop && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="text-center">
                          <h4 className="text-sm font-medium mb-2">Preview:</h4>
                          <canvas
                            ref={bannerPreviewCanvasRef}
                            className="border rounded max-w-full h-auto mx-auto"
                            style={{
                              objectFit: "contain",
                              width: Math.min(bannerCompletedCrop.width, 400),
                              height: Math.min(bannerCompletedCrop.height, 67),
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleBannerCropComplete}>
                          Apply Crop
                        </Button>
                        <Button variant="outline" onClick={handleBannerCropCancel}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
