import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export const alt = "Papermark Year in Review";
export const contentType = "image/png";

export async function GET(req: NextRequest) {
  const InterBold = await fetch(
    new URL("@/public/_static/Inter-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  const size = {
    width: 1200,
    height: 630,
  };
  const year = req.nextUrl.searchParams.get("year") || "2024";
  const minutesSpentOnDocs =
    req.nextUrl.searchParams.get("minutesSpentOnDocs") || "1000";
  const uploadedDocuments =
    req.nextUrl.searchParams.get("uploadedDocuments") || "100";
  const sharedLinks = req.nextUrl.searchParams.get("sharedLinks") || "10";
  const receivedViews = req.nextUrl.searchParams.get("receivedViews") || "1000";

  return new ImageResponse(
    (
      <div
        tw="flex flex-col bg-gray-50 w-full h-full"
        style={{ padding: "48px" }}
      >
        {/* Header */}
        <div tw="flex flex-col items-center mb-16">
          <div tw="flex text-5xl font-bold mb-2">Papermark</div>
          <div tw="flex text-4xl mb-2">Year in Review</div>
          <div tw="flex text-5xl font-bold">{year}</div>
        </div>

        {/* Stats Grid */}
        <div tw="flex w-full justify-between">
          {/* Minutes Spent */}
          <div
            tw="flex flex-col items-center justify-center rounded-3xl p-8"
            style={{
              width: "260px",
              height: "260px",
              background:
                "linear-gradient(135deg, rgba(251, 122, 0, 0.2), rgba(251, 122, 0, 0.7))",
            }}
          >
            <div tw="flex text-2xl text-[#a63b00] mb-2">Minutes Spent</div>
            <div tw="flex text-4xl font-bold">{minutesSpentOnDocs}</div>
          </div>

          {/* Documents */}
          <div
            tw="flex flex-col items-center justify-center rounded-3xl p-8"
            style={{
              width: "260px",
              height: "260px",
              background:
                "linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(75, 85, 99, 0.7))",
            }}
          >
            <div tw="flex text-2xl text-gray-600 mb-2">Documents</div>
            <div tw="flex text-4xl font-bold">{uploadedDocuments}</div>
          </div>

          {/* Links Shared */}
          <div
            tw="flex flex-col items-center justify-center rounded-3xl p-8"
            style={{
              width: "260px",
              height: "260px",
              background:
                "linear-gradient(135deg, rgba(228, 197, 160, 0.2), rgba(228, 197, 160, 0.7))",
            }}
          >
            <div tw="flex text-2xl text-[#9c7b4a] mb-2">Links Shared</div>
            <div tw="flex text-4xl font-bold">{sharedLinks}</div>
          </div>

          {/* Total Views */}
          <div
            tw="flex flex-col items-center justify-center rounded-3xl p-8"
            style={{
              width: "260px",
              height: "260px",
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.7))",
            }}
          >
            <div tw="flex text-2xl text-[#065f46] mb-2">Total Views</div>
            <div tw="flex text-4xl font-bold">{receivedViews}</div>
          </div>
        </div>

        {/* Footer */}
        <div tw="flex w-full justify-center mt-16">
          <div tw="flex text-xl text-gray-400">papermark.io</div>
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
