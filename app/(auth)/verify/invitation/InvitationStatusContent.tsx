"use client";

import Link from "next/link";

import { AlertCircleIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InvitationStatusContentProps {
  email?: string;
  status: "expired" | "revoked";
}

export default function InvitationStatusContent({
  email,
  status,
}: InvitationStatusContentProps) {
  const statusConfig = {
    expired: {
      title: "Invitation Link Expired",
      message: "This invitation link has expired.\nIt is no longer valid.",
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
      <div
        className={`flex items-center justify-center rounded-full ${config.iconColor} p-4`}
      >
        <AlertCircleIcon className={`h-8 w-8 ${config.iconTextColor}`} />
      </div>

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
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 w-full text-center text-xs text-gray-500">
        <p>
          Papermark helps you share documents with analytics and engagement
          tracking.
          <br />
          Join thousands of teams already using{" "}
          <Link
            href="https://www.papermark.com"
            target="_blank"
            className="underline hover:text-gray-900"
          >
            Papermark
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
