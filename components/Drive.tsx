"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Eye from "./shared/icons/eye";
import Import from "./shared/icons/import";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

export default function Drive() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Import from drive</Button>
      </DialogTrigger>
      <DialogContent>
        <DriveViewer />
      </DialogContent>
    </Dialog>
  );
}

const DriveViewer = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getFilesFromDrive();
      const { files, nextPageToken } = data || {};
      setFiles(files);
      setNextPageToken(nextPageToken);
    })();
  }, []);

  const getFilesFromDrive = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`api/integrations/google-drive`);
      const data = await resp.json();

      return (
        data ?? {
          files: [],
        }
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {};

  return (
    <>
      <h1>Documents</h1>
      <div className="max-h-[90vh] overflow-y-scroll flex flex-col gap-2">
        {loading && <p>...Loading</p>}
        {files?.map((file: any) => {
          return (
            <div
              key={file.id}
              className="w-full flex justify-between items-center rounded-md py-2 px-4 border-slate-200 border-[1px]"
            >
              <div className="flex gap-2 items-center ">
                <Image
                  src={file.thumbnailLink}
                  alt="thumbnail"
                  height={100}
                  width={100}
                  className={"h-[30px] w-[30px]"}
                />
                <h1 className="text-sm text-ellipsis overflow-hidden">
                  {file?.name ?? ""}
                </h1>
              </div>

              <div className="flex gap-4 items-center ">
                <Link
                  target={"_blank"}
                  href={file?.webViewLink}
                  className="text-black rounded-md bg-gray-200 dark:bg-gray-700 p-1 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 hover:dark:bg-emerald-200 active:scale-95"
                >
                  <Eye />
                </Link>
                <button
                  onClick={handleImport}
                  className="text-black rounded-md bg-gray-200 dark:bg-gray-700 p-1 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 hover:dark:bg-emerald-200 active:scale-95"
                >
                  <Import />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
