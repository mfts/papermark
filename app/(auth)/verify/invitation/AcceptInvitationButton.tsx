"use client";

import Link from "next/link";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AcceptInvitationButtonProps {
  verificationUrl: string;
}

export default function AcceptInvitationButton({
  verificationUrl,
}: AcceptInvitationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = () => {
    setIsLoading(true);
  };

  return (
    <Link href={verificationUrl}>
      <Button
        className="focus:shadow-outline w-full transform rounded-lg bg-gray-800 px-4 py-3 text-white transition-colors duration-300 ease-in-out hover:bg-gray-900 focus:outline-none"
        onClick={handleAccept}
        loading={isLoading}
      >
        Accept Invitation
      </Button>
    </Link>
  );
}
