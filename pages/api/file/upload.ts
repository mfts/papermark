import { put } from "@vercel/blob";
import { NextResponse, NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function upload(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "File name or file not submitted" },
      { status: 400 }
    );
  }

  // console.log(file)

  const blob = await put(file.name, file, { access: "public" });

  // console.log(blob)

  return NextResponse.json(blob);
}
