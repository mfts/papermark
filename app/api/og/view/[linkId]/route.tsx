/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { Brand, DataroomBrand } from "@prisma/client";

import { CustomUser, LinkWithDataroom, LinkWithDocument } from "@/lib/types";

// import { fileIcon } from "@/lib/utils/get-file-icon";

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
  let fileFormat = "Document";
  let fileType = "";
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/links/${linkId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = (await res.json()) as DocumentLinkData | DataroomLinkData;
    if (data.linkType === "DOCUMENT_LINK") {
      fileName = data.link.document.name;
      fileFormat = data.link.document.name.split(".").pop() ?? "Document";
      fileType = data.link.document.type ?? "";
      //   console.log(data.link.document);
    }
  } catch (error) {
    console.error(error);
  }
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title") || "Papermark Document";
  const Inter = await fetch(
    new URL("@/public/_static/Inter-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center justify-between w-full h-full bg-white text-gray-900 p-12">
        <div tw="flex text-[32px] justify-between w-full items-center">
          <div tw="flex-grow text-gray-800/75">{fileName}</div>
          <div tw="text-[32px] flex items-center tracking-tighter flex-shrink-0 text-black">
            Papermark
          </div>
        </div>
        <div tw="text-[42px] flex-grow flex text-center p-12">
          <div tw="bg-gray-200 text-gray-500 w-full h-full rounded-3xl flex flex-col items-center justify-center">
            .{fileFormat}
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
          data: Inter,
        },
      ],
    },
  );
}
