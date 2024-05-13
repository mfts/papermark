import { NextRequest, NextResponse } from "next/server";

import { put } from "@vercel/blob";

export const config = {
  runtime: "edge",
};

export default async function upload(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "File name or file not submitted" },
      { status: 400 },
    );
  }

  const blob = await put(file.name, file, { access: "public" });

  return NextResponse.json(blob);
}
