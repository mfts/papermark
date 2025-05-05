"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function InvitationStatusContent({
  status,
}: {
  status: "expired" | "revoked";
}) {
  const statusConfig = {
    expired: {
      title: "Invitation Expired",
      message:
        "This invitation has expired. It is no longer valid.\nAsk your admin to send you a new invitation.",
      iconColor: "bg-amber-100",
      iconTextColor: "text-amber-600",
    },
    revoked: {
      title: "Invitation No Longer Available",
      message: "It may have been used or revoked \nby the team administrator.",
      iconColor: "bg-red-100",
      iconTextColor: "text-red-600",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full text-center">
        <h3 className="text-2xl font-bold text-gray-800">{config.title}</h3>
        <p className="mx-auto mt-2 max-w-xs whitespace-pre-line break-words text-sm text-gray-600">
          {config.message}
        </p>
      </div>
      <div className="w-full space-y-4">
        <h4 className="text-center text-sm font-medium text-gray-800">
          Create your own Papermark account
        </h4>
        <div className="space-y-3">
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-gray-800 hover:bg-gray-900">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
