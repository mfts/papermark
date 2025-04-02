import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { Domain, LinkType } from "@prisma/client";
import { SelectGroup } from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  FolderIcon,
  ServerIcon,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { DataroomWithCount } from "@/lib/swr/use-datarooms";
import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";
import { FolderSelectionModal } from "./folder-selection-modal";

export default function FolderSelectionSection({
  data,
  setData,
  linkType,
  editLink,
  datarooms,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  linkType: LinkType;
  editLink?: boolean;
  datarooms: DataroomWithCount[] | undefined;
}) {

  const [open, setOpen] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>("");
  const [value, setValue] = useState<{
    name: string;
    id: string;
  }>({
    id: data.uploadFolderId
      ? "all_documents"
      : data.uploadDataroomFolderId
        ? data.uploadDataroomFolderId
        : "",
    name: data.dataroomName || "",
  });

  const slug = useRef({
    id: data.uploadFolderId
      ? "all_documents"
      : data.uploadDataroomFolderId
        ? data.uploadDataroomFolderId
        : "",
    name: data.dataroomName || "",
  });

  const handleFolderChange = (data: string) => {
    if (data !== "all_documents") {
      const [id, name] = data.split("_");
      slug.current = value;
      setValue({ id, name });
    } else {
      slug.current = value;
      setValue({ id: "all_documents", name: "All Documents Folder" });
    }
    setOpen(true);
  };

  const handleSelectFolder = (id: string, name: string) => {
    if (value.id === "all_documents") {
      setData({ ...data, uploadFolderId: id, uploadDataroomFolderId: null });
    } else {
      setData({ ...data, uploadDataroomFolderId: id, uploadFolderId: null });
    }
    setFolderName(name);
  };

  const handleModalClose = (open: boolean) => {
    setOpen(open);
    setValue({ id: slug.current.id, name: slug.current.name });
  };

  return (
    <>
      <Label htmlFor="link-domain" className="flex items-center gap-2">
        <span>Folder for uploaded file</span>
        <BadgeTooltip content="This is the folder that will be used to store uploaded files. If you don't select a folder, the files will be stored in the All Documents.">
          <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
        </BadgeTooltip>
      </Label>
      <div className="flex">
        <Select key={crypto.randomUUID()} onValueChange={handleFolderChange}>
          <SelectTrigger
            className={
              "flex w-full rounded-none rounded-l-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm"
            }
          >
            <span className="pointer-events-none !flex items-center gap-1">
              {value.id === "all_documents" ? (
                <>
                  <FolderIcon className="h-4 w-4" /> All Documents Folder{" "}
                  <ChevronRightIcon className="h-4 w-4" />{" "}
                  {folderName || data.selectedFolderName}
                </>
              ) : value.id ? (
                <>
                  <ServerIcon className="h-4 w-4" /> {value.name}{" "}
                  <ChevronRightIcon className="h-4 w-4" />{" "}
                  {folderName || data.selectedFolderName}
                </>
              ) : (
                "Select Folder"
              )}
            </span>
          </SelectTrigger>
          <SelectContent className="flex w-full rounded-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm">
            <>
              <SelectItem
                value="all_documents"
                className={cn(
                  "hover:bg-muted hover:dark:bg-gray-700",
                  value.id === "all_documents" && "pl-2",
                )}
              >
                {value.id === "all_documents" ? (
                  <span className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    <span>All Documents Folder</span>
                  </span>
                ) : (
                  "All Documents Folder"
                )}
              </SelectItem>
              <SelectSeparator />
              {datarooms && datarooms.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="pl-3">
                    Select Dataroom Folder
                  </SelectLabel>
                  {datarooms.map(({ id, name }) => (
                    <SelectItem
                      key={id}
                      value={`${id}_${name}`}
                      className={cn(
                        "hover:bg-muted hover:dark:bg-gray-700",
                        value.id === id && "pl-2",
                      )}
                    >
                      {value.id === id ? (
                        <span className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4" />
                          <span>{name}</span>
                        </span>
                      ) : (
                        name
                      )}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </>
          </SelectContent>
        </Select>
        <FolderSelectionModal
          open={open}
          setOpen={setOpen}
          value={value}
          handleSelectFolder={handleSelectFolder}
          handleModalClose={handleModalClose}
        />
      </div>
    </>
  );
}
