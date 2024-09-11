import { useCallback, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkPreset } from "@prisma/client";
import { motion } from "framer-motion";
import { Upload as ArrowUpTrayIcon } from "lucide-react";
import useSWRImmutable from "swr/immutable";

import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { cn, fetcher } from "@/lib/utils";
import { resizeImage } from "@/lib/utils/resize-image";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";
import { LinkUpgradeOptions } from "./link-options";

export default function OGSection({
  data,
  setData,
  isAllowed,
  handleUpgradeStateChange,
  editLink,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  handleUpgradeStateChange: ({
    state,
    trigger,
    plan,
  }: LinkUpgradeOptions) => void;
  editLink: boolean;
}) {
  const { enableCustomMetatag, metaTitle, metaDescription, metaImage } = data;
  const teamInfo = useTeam();
  const { data: presets } = useSWRImmutable<LinkPreset>(
    `/api/teams/${teamInfo?.currentTeam?.id}/presets`,
    fetcher,
  );

  const [enabled, setEnabled] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onChangePicture = useCallback(
    async (e: any) => {
      setFileError(null);
      const file = e.target.files[0];
      if (file) {
        if (file.size / 1024 / 1024 > 5) {
          setFileError("File size too big (max 5MB)");
        } else if (file.type !== "image/png" && file.type !== "image/jpeg") {
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

  useEffect(() => {
    setEnabled(enableCustomMetatag);
  }, [enableCustomMetatag]);

  useEffect(() => {
    if (presets && !(metaTitle || metaDescription || metaImage)) {
      const preset = presets;
      if (preset) {
        setData((prev) => ({
          ...prev,
          metaImage: prev.metaImage || preset.metaImage,
          metaTitle: prev.metaTitle || preset.metaTitle,
          metaDescription: prev.metaDescription || preset.metaDescription,
          enableCustomMetatag: !editLink && true,
        }));
      }
    }
  }, [
    presets,
    setData,
    editLink,
    enableCustomMetatag,
    metaTitle,
    metaDescription,
    metaImage,
  ]);

  const handleCustomMetatag = async () => {
    const updatedCustomMetatag = !enabled;

    setData({ ...data, enableCustomMetatag: updatedCustomMetatag });
    setEnabled(updatedCustomMetatag);
  };

  const resetMetatags = () => {
    setData({
      ...data,
      metaImage: null || (presets?.metaImage ?? null),
      metaTitle: null || (presets?.metaTitle ?? null),
      metaDescription: null || (presets?.metaDescription ?? null),
    });
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Custom social media cards"
        enabled={enableCustomMetatag}
        action={handleCustomMetatag}
        isAllowed={isAllowed}
        requiredPlan="Business"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_og_section",
            plan: "Business",
          })
        }
        resetAction={resetMetatags}
      />

      {enabled && (
        <motion.div
          className="relative mt-4 space-y-3 rounded-md shadow-sm"
          {...FADE_IN_ANIMATION_SETTINGS}
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="block text-sm font-medium text-foreground">Image</p>
              {fileError ? (
                <p className="text-sm text-red-500">{fileError}</p>
              ) : null}
            </div>
            <label
              htmlFor="image"
              className="group relative mt-1 flex aspect-[1200/630] h-full min-h-[14rem] cursor-pointer flex-col items-center justify-center rounded-md border border-input bg-white shadow-sm transition-all hover:border-muted-foreground hover:bg-gray-50 hover:ring-muted-foreground dark:bg-gray-800 hover:dark:bg-transparent"
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
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  setFileError(null);
                  const file = e.dataTransfer.files && e.dataTransfer.files[0];
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
                  metaImage
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
              {metaImage && (
                <img
                  src={metaImage}
                  alt="Preview"
                  className="h-full w-full rounded-md object-cover"
                />
              )}
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onChangePicture}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="block text-sm font-medium text-foreground">Title</p>
              <p className="text-sm text-muted-foreground">
                {metaTitle?.length || 0}/120
              </p>
            </div>
            <div className="relative mt-1 flex rounded-md shadow-sm">
              {false && (
                <div className="absolute flex h-full w-full items-center justify-center rounded-md border border-gray-300 bg-white">
                  <LoadingSpinner />
                </div>
              )}
              <Input
                name="title"
                id="title"
                maxLength={120}
                className="focus:ring-inset"
                placeholder={`Papermark - open-source document sharing infrastructure.`}
                value={metaTitle || ""}
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
                {metaDescription?.length || 0}/240
              </p>
            </div>
            <div className="relative mt-1 flex rounded-md shadow-sm">
              {false && (
                <div className="absolute flex h-full w-full items-center justify-center rounded-md border border-gray-300 bg-white">
                  <LoadingSpinner />
                </div>
              )}
              <Textarea
                name="description"
                id="description"
                rows={3}
                maxLength={240}
                className="focus:ring-inset"
                placeholder={`Papermark is an open-source document sharing infrastructure for modern teams.`}
                value={metaDescription || ""}
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
        </motion.div>
      )}
    </div>
  );
}
