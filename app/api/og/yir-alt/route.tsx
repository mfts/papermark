import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export const alt = "Papermark Year in Review";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export async function GET(req: NextRequest) {
  const InterBold = await fetch(
    new URL("@/public/_static/Inter-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  const year = req.nextUrl.searchParams.get("year") || "2024";
  const minutesSpentOnDocs =
    req.nextUrl.searchParams.get("minutesSpentOnDocs") || "1000";
  const uploadedDocuments =
    req.nextUrl.searchParams.get("uploadedDocuments") || "100";
  const sharedLinks = req.nextUrl.searchParams.get("sharedLinks") || "10";
  const receivedViews = req.nextUrl.searchParams.get("receivedViews") || "1000";

  return new ImageResponse(
    (
      <div tw="flex flex-row bg-[#f9fafb] w-full h-full p-16">
        <div tw="flex flex-col justify-center w-1/2">
          <div tw="flex text-7xl font-bold mb-8">Papermark</div>
          <div tw="flex text-4xl font-base">{year} IN REVIEW</div>
        </div>

        <div tw="flex flex-col w-1/2 bg-white rounded-lg shadow-md p-12">
          <div tw="flex flex-col border-b border-gray-200 pb-6 mb-8">
            <div tw="flex text-4xl font-bold text-gray-800">
              Papermark Stats
            </div>
          </div>
          <div tw="flex flex-col space-y-10">
            <div tw="flex justify-between items-center">
              <div tw="flex text-2xl text-gray-600">Minutes spent on docs</div>
              <div tw="flex text-3xl font-bold text-gray-900">
                {minutesSpentOnDocs}
              </div>
            </div>
            <div tw="flex justify-between items-center">
              <div tw="flex text-2xl text-gray-600">Documents uploaded</div>
              <div tw="flex text-3xl font-bold text-gray-900">
                {uploadedDocuments}
              </div>
            </div>
            <div tw="flex justify-between items-center">
              <div tw="flex text-2xl text-gray-600">Links shared</div>
              <div tw="flex text-3xl font-bold text-gray-900">
                {sharedLinks}
              </div>
            </div>
            <div tw="flex justify-between items-center">
              <div tw="flex text-2xl text-gray-600">Views received</div>
              <div tw="flex text-3xl font-bold text-gray-900">
                {receivedViews}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=3600, immutable",
      },
      fonts: [
        {
          name: "Inter Bold",
          data: InterBold,
        },
      ],
    },
  );
}
