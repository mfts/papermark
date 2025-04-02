"use client";

import { ReactNode, useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { convertDataUrlToFile, uploadImage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";

interface UploadAvatarProps {
  title: string;
  description: string;
  helpText?: string | ReactNode;
  buttonText?: string;
}

const UploadAvatar = ({
  title,
  description,
  helpText,
  buttonText,
}: UploadAvatarProps) => {
  const [uploading, setUploading] = useState(false);
  const { data: session, update } = useSession();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.image) {
      setImage(session.user.image);
    }
  }, [session]);

  return (
    <form
      onSubmit={async (e) => {
        setUploading(true);
        e.preventDefault();
        if (!image) {
          return;
        }
        const blob = convertDataUrlToFile({ dataUrl: image });
        const blobUrl = await uploadImage(blob);
        fetch("/api/account", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: blobUrl }),
        }).then(async (res) => {
          setUploading(false);
          if (!res.ok) {
            const errorMessage = await res.text();
            toast.error(errorMessage || "Something went wrong");
            return;
          }
          await update();
          toast.success("Successfully updated your profile picture!");
        });
      }}
      className="rounded-lg"
    >
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            accept="images"
            className="h-24 w-24 rounded-full border border-gray-300"
            iconClassName="w-5 h-5"
            variant="plain"
            imageSrc={image}
            readFile
            onChange={({ src, file }) => setImage(src)}
            content={null}
            maxFileSizeMB={2}
            targetResolution={{ width: 160, height: 160, quality: 100 }}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
          {typeof helpText === "string" ? (
            <p
              className="text-sm text-muted-foreground transition-colors"
              dangerouslySetInnerHTML={{ __html: helpText || "" }}
            />
          ) : (
            helpText
          )}
          <div className="shrink-0">
            <Button
              loading={uploading}
              disabled={!image || session?.user?.image === image}
            >
              {buttonText || "Save Changes"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
};

export default UploadAvatar;
