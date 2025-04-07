import { ChangeEvent, useCallback, useState } from "react";
import { Upload as ArrowUpTrayIcon, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { resizeImage } from "@/lib/utils/resize-image";
import { validateImageDimensions } from "@/lib/utils";
import { PresetData } from "@/pages/settings/presets";

interface SocialMediaCardPresetProps {
    data: PresetData;
    setData: React.Dispatch<React.SetStateAction<PresetData>>;
}

export default function SocialMediaCardPreset({
    data,
    setData,
}: SocialMediaCardPresetProps) {
    const [fileError, setFileError] = useState<string | null>(null);
    const [faviconFileError, setFaviconFileError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [faviconDragActive, setFaviconDragActive] = useState(false);

    const onChangePicture = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            setFileError(null);
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (file.size / 1024 / 1024 > 5) {
                    setFileError("File size too big (max 5MB)");
                } else if (
                    file.type !== "image/png" &&
                    file.type !== "image/jpeg" &&
                    file.type !== "image/jpg"
                ) {
                    setFileError("File type not supported (.png or .jpg only)");
                } else {
                    const image = await resizeImage(file);
                    setData((prev) => ({
                        ...prev,
                        metaImage: image,
                    }));
                }
            }
        },
        [setData],
    );

    const onChangeFavicon = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            setFaviconFileError(null);
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (file.size / 1024 / 1024 > 1) {
                    setFaviconFileError("File size too big (max 1MB)");
                } else if (
                    file.type !== "image/png" &&
                    file.type !== "image/x-icon" &&
                    file.type !== "image/svg+xml"
                ) {
                    setFaviconFileError(
                        "File type not supported (.png, .ico, .svg only)",
                    );
                } else {
                    const image = await resizeImage(file, {
                        width: 36,
                        height: 36,
                        quality: 1,
                    });
                    const isValidDimensions = await validateImageDimensions(
                        image,
                        16,
                        48,
                    );
                    if (!isValidDimensions) {
                        setFaviconFileError(
                            "Image dimensions must be between 16x16 and 48x48",
                        );
                    } else {
                        setData((prev) => ({
                            ...prev,
                            metaFavicon: image,
                        }));
                    }
                }
            }
        },
        [setData],
    );

    return (
        <div className="relative mt-5 space-y-3 rounded-md px-5">
            <div>
                <div className="flex items-center justify-between">
                    <p className="block text-sm font-medium text-foreground">
                        Image
                    </p>
                    {fileError ? (
                        <p className="text-sm text-red-500">{fileError}</p>
                    ) : null}
                </div>
                <label
                    htmlFor="mainImage"
                    className="group relative mt-1 flex aspect-[1200/630] h-full cursor-pointer flex-col items-center justify-center rounded-md border border-input bg-white shadow-sm transition-all hover:border-muted-foreground hover:bg-gray-50 hover:ring-muted-foreground dark:bg-gray-800 hover:dark:bg-transparent"
                >
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
                        onDrop={async (e) => {
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
                                    file.type !== "image/jpeg" &&
                                    file.type !== "image/jpg"
                                ) {
                                    setFileError(
                                        "File type not supported (.png or .jpg only)",
                                    );
                                } else {
                                    const image = await resizeImage(file);
                                    setData((prev) => ({
                                        ...prev,
                                        metaImage: image,
                                    }));
                                }
                            }
                        }}
                    />
                    <div
                        className={cn(
                            "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md transition-all",
                            dragActive &&
                            "cursor-copy border-2 border-black bg-gray-50 opacity-100 dark:bg-transparent",
                            data.metaImage
                                ? "opacity-0 group-hover:opacity-100"
                                : "group-hover:bg-gray-50 group-hover:dark:bg-transparent",
                        )}
                    >
                        <ArrowUpTrayIcon
                            className={cn(
                                "h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95",
                                dragActive ? "scale-110" : "scale-100",
                            )}
                        />
                        <p className="mt-2 text-center text-sm text-gray-500">
                            Drag and drop or click to upload.
                        </p>
                        <p className="mt-2 text-center text-sm text-gray-500">
                            Recommended: 1200 x 630 pixels (max 5MB)
                        </p>
                        <span className="sr-only">OG image upload</span>
                    </div>
                    {data.metaImage && (
                        <img
                            src={data.metaImage}
                            alt="Preview"
                            className="h-full w-full rounded-md object-cover"
                        />
                    )}
                </label>
                <div className="mt-1 hidden rounded-md shadow-sm">
                    <input
                        id="mainImage"
                        name="image"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="sr-only"
                        onChange={onChangePicture}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="faviconIcon">
                        Favicon Icon{" "}
                        <span className="text-sm italic text-muted-foreground">
                            (max 1 MB)
                        </span>
                    </Label>
                    {faviconFileError ? (
                        <p className="text-sm text-red-500">{faviconFileError}</p>
                    ) : null}
                </div>
                <label
                    htmlFor="faviconIcon"
                    className="group relative mt-1 flex size-14 cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
                    style={{
                        backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 0, 10px -10px, 0px 10px",
                    }}
                >
                    <div
                        className="absolute z-[5] h-full w-full rounded-md"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaviconDragActive(true);
                        }}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaviconDragActive(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaviconDragActive(false);
                        }}
                        onDrop={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaviconDragActive(false);
                            setFaviconFileError(null);
                            const file =
                                e.dataTransfer.files && e.dataTransfer.files[0];
                            if (file) {
                                if (file.size / 1024 / 1024 > 1) {
                                    setFaviconFileError("File size too big (max 1MB)");
                                } else if (
                                    file.type !== "image/png" &&
                                    file.type !== "image/x-icon" &&
                                    file.type !== "image/svg+xml"
                                ) {
                                    setFaviconFileError(
                                        "File type not supported (.png, .ico, .svg only)",
                                    );
                                } else {
                                    const image = await resizeImage(file, {
                                        width: 36,
                                        height: 36,
                                        quality: 1,
                                    });
                                    const isValidDimensions =
                                        await validateImageDimensions(image, 16, 48);
                                    if (!isValidDimensions) {
                                        setFaviconFileError(
                                            "Image dimensions must be between 16x16 and 48x48",
                                        );
                                    } else {
                                        setData((prev) => ({
                                            ...prev,
                                            metaFavicon: image,
                                        }));
                                    }
                                }
                            }
                        }}
                    />
                    <div
                        className={`${faviconDragActive
                            ? "cursor-copy border-2 border-black bg-gray-50 opacity-100"
                            : ""
                            } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md bg-white transition-all ${data.metaFavicon
                                ? "opacity-0 group-hover:opacity-100"
                                : "group-hover:bg-gray-50"
                            }`}
                    >
                        <PlusIcon
                            className={`${faviconDragActive ? "scale-110" : "scale-100"
                                } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
                        />
                        <span className="sr-only">OG image upload</span>
                    </div>
                    {data.metaFavicon && (
                        <img
                            src={data.metaFavicon}
                            alt="Preview"
                            className="h-full w-full rounded-md object-contain"
                        />
                    )}
                </label>
                <div className="mt-1 hidden rounded-md shadow-sm">
                    <input
                        id="faviconIcon"
                        name="favicon"
                        type="file"
                        accept="image/png,image/x-icon,image/svg+xml"
                        className="sr-only"
                        onChange={onChangeFavicon}
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <p className="block text-sm font-medium text-foreground">
                        Title
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {data.metaTitle?.length || 0}/120
                    </p>
                </div>
                <div className="relative mt-1 flex rounded-md shadow-sm">
                    <Input
                        name="title"
                        id="title"
                        maxLength={120}
                        className="focus:ring-inset"
                        placeholder={`Papermark - open-source document sharing infrastructure.`}
                        value={data.metaTitle || ""}
                        onChange={(e) => {
                            setData({ ...data, metaTitle: e.target.value });
                        }}
                        aria-invalid="true"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <p className="block text-sm font-medium text-foreground">
                        Description
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {data.metaDescription?.length || 0}/240
                    </p>
                </div>
                <div className="relative mt-1 flex rounded-md shadow-sm">
                    <Textarea
                        name="description"
                        id="description"
                        rows={3}
                        maxLength={240}
                        className="focus:ring-inset"
                        placeholder={`Papermark is an open-source document sharing infrastructure for modern teams.`}
                        value={data.metaDescription || ""}
                        onChange={(e) => {
                            setData({
                                ...data,
                                metaDescription: e.target.value,
                            });
                        }}
                        aria-invalid="true"
                    />
                </div>
            </div>
        </div>
    );
} 