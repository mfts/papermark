import { useRouter } from "next/router";

import { useCallback, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlusIcon } from "lucide-react";
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

import { useDataroomBrand } from "@/lib/swr/use-brand";
import { useDataroom } from "@/lib/swr/use-dataroom";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";

export default function DataroomBrandPage() {
  const router = useRouter();
  const teamInfo = useTeam();
  const { dataroom } = useDataroom();
  const { brand } = useDataroomBrand({ dataroomId: dataroom?.id });

  const [brandColor, setBrandColor] = useState<string>("#000000");
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

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
            setBanner(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [setBanner],
  );

  useEffect(() => {
    if (brand) {
      setBrandColor(brand.brandColor || "#000000");
      setLogo(brand.logo || null);
      setBanner(brand.banner || null);
    }
  }, [brand]);

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
      setBanner(blobUrl);
    }

    const data = {
      brandColor: brandColor,
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
      setBanner(null);
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
            actions={
              [
                // <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
                //   Create Link
                // </Button>,
              ]
            }
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        <div className="space-y-4">
          <div>
            <Card className="dark:bg-secondary">
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  {/* Logo Input */}
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
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 0, 10px -10px, 0px 10px",
                      }}
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
                      htmlFor="banner-image"
                      className="group relative mt-1 flex h-[4rem] w-[12rem] cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 0, 10px -10px, 0px 10px",
                      }}
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
                            if (file.size / 1024 / 1024 > 5) {
                              setFileError("File size too big (max 5MB)");
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
                                setBanner(e.target?.result as string);
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
                          banner
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
                        id="banner-image"
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png"
                        className="sr-only"
                        onChange={onChangeBanner}
                      />
                    </div>
                  </div>

                  {/* Brand Color Input */}
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
                </div>
              </CardContent>
              <CardFooter className="border-t p-6">
                <Button onClick={saveBranding} loading={isLoading}>
                  Save changes
                </Button>

                {/* delete button */}
                <Button variant="link" onClick={handleDelete} disabled={!brand}>
                  Reset branding
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
