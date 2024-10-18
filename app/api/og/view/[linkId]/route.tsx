/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { Brand, DataroomBrand } from "@prisma/client";

import { LinkWithDataroom, LinkWithDocument } from "@/lib/types";

import { ogFileIcon } from "@/components/og/icons/og-file-icon";

export const runtime = "edge";

type DocumentLinkData = {
  linkType: "DOCUMENT_LINK";
  link: LinkWithDocument;
  brand: Brand | null;
};

type DataroomLinkData = {
  linkType: "DATAROOM_LINK";
  link: LinkWithDataroom;
  brand: DataroomBrand | null;
};

/**
 * @name Headline Template
 * @description Make it pop with a headline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } },
) {
  const linkId = params.linkId;
  let fileName = "Papermark";
  let fileType = "";
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/links/${linkId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = (await res.json()) as DocumentLinkData | DataroomLinkData;
    if (data.linkType === "DOCUMENT_LINK") {
      fileName = data.link.document.name;
      fileType =
        data.link.document.versions[data.link.document.versions.length - 1]
          .type ?? "";
      console.log(data.link);
    }
    if (data.linkType === "DATAROOM_LINK") {
      fileName = data.link.dataroom.name;
      fileType = "folder";
    }
  } catch (error) {
    console.error(error);
  }
  const InterMedium = await fetch(
    new URL("@/public/_static/Inter-Medium.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());
  const InterBold = await fetch(
    new URL("@/public/_static/Inter-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center justify-between w-full h-full bg-white text-gray-900 p-12 pb-6 font-medium">
        <div tw="flex text-[42px] justify-between w-full items-center pr-6">
          <div
            style={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            tw="flex-grow overflow-hidden"
          >
            {fileName}
          </div>
          <div tw="text-[32px] font-bold flex items-center tracking-tighter flex-shrink-0 text-black">
            Papermark
          </div>
        </div>
        <div tw="text-[42px] flex-grow flex text-center p-6 pt-12">
          <div tw="bg-gray-200 text-gray-500 w-full h-full rounded-3xl flex flex-col items-center justify-center">
            <div tw="flex">
              {ogFileIcon({
                fileType: fileType,
              })}
            </div>
            <div
              style={{
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              tw="w-full overflow-hidden text-center flex justify-center p-6 font-bold"
            >
              {fileName}
            </div>
          </div>
        </div>
        <div tw="text-[24px] flex items-center">
          Open-Source Document Sharing
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, immutable",
      },
      fonts: [
        {
          name: "Inter",
          data: InterBold,
          weight: 700,
        },
        {
          name: "Inter",
          data: InterMedium,
          weight: 500,
        },
      ],
    },
  );
}
