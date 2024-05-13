import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";
import { Upload as ArrowUpTrayIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

export default function OGSection({
  data,
  setData,
  hasFreePlan,
  handleUpgradeStateChange,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  hasFreePlan: boolean;
  handleUpgradeStateChange: (state: boolean, trigger: string) => void;
}) {
  const { enableCustomMetatag, metaTitle, metaDescription, metaImage } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onChangePicture = useCallback(
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
            setData((prev) => ({
              ...prev,
              metaImage: e.target?.result as string,
            }));
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [setData],
  );

  useEffect(() => {
    setEnabled(enableCustomMetatag);
  }, [enableCustomMetatag]);

  const handleCustomMetatag = async () => {
    const updatedCustomMetatag = !enabled;

    setData({ ...data, enableCustomMetatag: updatedCustomMetatag });
    setEnabled(updatedCustomMetatag);
  };

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-2">
          <h2
            className={cn(
              "text-sm font-medium leading-6",
              enabled ? "text-foreground" : "text-muted-foreground",
              hasFreePlan ? "cursor-pointer" : undefined,
            )}
            onClick={
              hasFreePlan
                ? () => handleUpgradeStateChange(true, "link_sheet_og_section")
                : undefined
            }
          >
            Custom social media cards
            {hasFreePlan && (
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs text-foreground ring-1 ring-gray-800 dark:ring-gray-500">
                Pro
              </span>
            )}
          </h2>
        </div>
        <Switch
          checked={enabled}
          onClick={
            hasFreePlan
              ? () => handleUpgradeStateChange(true, "link_sheet_og_section")
              : undefined
          }
          className={hasFreePlan ? "opacity-50" : undefined}
          onCheckedChange={hasFreePlan ? undefined : handleCustomMetatag}
        />
      </div>

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
              className="group relative mt-1 flex h-[14rem] cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
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
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setData((prev) => ({
                          ...prev,
                          metaImage: e.target?.result as string,
                        }));
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
                  metaImage
                    ? "opacity-0 group-hover:opacity-100"
                    : "group-hover:bg-gray-50"
                }`}
              >
                <ArrowUpTrayIcon
                  className={`${
                    dragActive ? "scale-110" : "scale-100"
                  } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
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
                className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
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
                className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
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
