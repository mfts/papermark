/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { Brand, DataroomBrand } from "@prisma/client";

import { LinkWithDataroom, LinkWithDocument } from "@/lib/types";

import { ogFileType } from "./file-type";

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

  let fileName = "No Name";
  let fileType = "File";
  let hasBrand = false;
  let brandLogo = "";

  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/links/${linkId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = (await res.json()) as DocumentLinkData | DataroomLinkData;

    if (data.brand) {
      hasBrand = true;
      brandLogo = data.brand.logo ?? "";
    }

    if (data.linkType === "DOCUMENT_LINK") {
      fileName = data.link.document.name;
      fileType =
        data.link.document.versions[data.link.document.versions.length - 1]
          .type ?? "";
    }
    if (data.linkType === "DATAROOM_LINK") {
      fileName = data.link.dataroom.name;
      fileType = "dataroom";
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
      <div
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3E%3Cdefs%3E%3Crect stroke='%23ffffff' stroke-width='0.2' width='1' height='1' id='s'/%3E%3Cpattern id='a' width='3' height='3' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cuse fill='%23fcfcfc' href='%23s' y='2'/%3E%3Cuse fill='%23fcfcfc' href='%23s' x='1' y='2'/%3E%3Cuse fill='%23fafafa' href='%23s' x='2' y='2'/%3E%3Cuse fill='%23fafafa' href='%23s'/%3E%3Cuse fill='%23f7f7f7' href='%23s' x='2'/%3E%3Cuse fill='%23f7f7f7' href='%23s' x='1' y='1'/%3E%3C/pattern%3E%3Cpattern id='b' width='7' height='11' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f5f5f5'%3E%3Cuse href='%23s'/%3E%3Cuse href='%23s' y='5' /%3E%3Cuse href='%23s' x='1' y='10'/%3E%3Cuse href='%23s' x='2' y='1'/%3E%3Cuse href='%23s' x='2' y='4'/%3E%3Cuse href='%23s' x='3' y='8'/%3E%3Cuse href='%23s' x='4' y='3'/%3E%3Cuse href='%23s' x='4' y='7'/%3E%3Cuse href='%23s' x='5' y='2'/%3E%3Cuse href='%23s' x='5' y='6'/%3E%3Cuse href='%23s' x='6' y='9'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='h' width='5' height='13' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f5f5f5'%3E%3Cuse href='%23s' y='5'/%3E%3Cuse href='%23s' y='8'/%3E%3Cuse href='%23s' x='1' y='1'/%3E%3Cuse href='%23s' x='1' y='9'/%3E%3Cuse href='%23s' x='1' y='12'/%3E%3Cuse href='%23s' x='2'/%3E%3Cuse href='%23s' x='2' y='4'/%3E%3Cuse href='%23s' x='3' y='2'/%3E%3Cuse href='%23s' x='3' y='6'/%3E%3Cuse href='%23s' x='3' y='11'/%3E%3Cuse href='%23s' x='4' y='3'/%3E%3Cuse href='%23s' x='4' y='7'/%3E%3Cuse href='%23s' x='4' y='10'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='c' width='17' height='13' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f2f2f2'%3E%3Cuse href='%23s' y='11'/%3E%3Cuse href='%23s' x='2' y='9'/%3E%3Cuse href='%23s' x='5' y='12'/%3E%3Cuse href='%23s' x='9' y='4'/%3E%3Cuse href='%23s' x='12' y='1'/%3E%3Cuse href='%23s' x='16' y='6'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='d' width='19' height='17' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23ffffff'%3E%3Cuse href='%23s' y='9'/%3E%3Cuse href='%23s' x='16' y='5'/%3E%3Cuse href='%23s' x='14' y='2'/%3E%3Cuse href='%23s' x='11' y='11'/%3E%3Cuse href='%23s' x='6' y='14'/%3E%3C/g%3E%3Cg fill='%23efefef'%3E%3Cuse href='%23s' x='3' y='13'/%3E%3Cuse href='%23s' x='9' y='7'/%3E%3Cuse href='%23s' x='13' y='10'/%3E%3Cuse href='%23s' x='15' y='4'/%3E%3Cuse href='%23s' x='18' y='1'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23a)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23b)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23h)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23c)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23d)' width='100%25' height='100%25'/%3E%3C/svg%3E")`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
        }}
        tw="flex relative flex-col items-center justify-between w-full h-full text-gray-900 font-medium"
      >
        <div tw="flex text-[24px] w-full justify-end items-center p-12 bg-white bg-opacity-50">
          <div tw="flex flex-col items-end">
            <div tw="text-[56px] font-bold flex items-center tracking-tighter flex-shrink-0 text-black">
              Papermark
            </div>
            <div tw="text-[32px] flex items-center">
              Open-Source Document Sharing
            </div>
          </div>
          {hasBrand && (
            <>
              <div tw="text-[125px] pr-[10px] pl-[30px] text-gray-500">/</div>
              <div tw="flex items-center justify-center">
                <img
                  src={brandLogo}
                  alt="Brand Logo"
                  tw="w-[125px] h-[125px] rounded-full border-gray-400 border-[5px] bg-gray-200"
                />
              </div>
            </>
          )}
        </div>

        <div tw="flex flex-col text-[42px] justify-center w-full items-start p-12 bg-white bg-opacity-50">
          <div
            style={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            tw="flex-grow text-[56px] overflow-hidden w-[90%]"
          >
            {fileName}
          </div>
          <div tw="text-[#fb7a00] pt-[10px] rounded-full uppercase">
            {ogFileType({ fileType })}
          </div>
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
