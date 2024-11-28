import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const report = await request.json();

  // Log the report or send to your logging service
  // console.log("CSP Violation:", report);

  // You could send this to your logging service
  // await fetch('your-logging-service', {
  //   method: 'POST',
  //   body: JSON.stringify(report)
  // })

  return NextResponse.json({ success: true });
}
