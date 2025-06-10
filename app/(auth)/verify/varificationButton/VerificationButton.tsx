"use client";

import Link from "next/link";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface VerificationButtonProps {
  verificationUrl: string;
  buttonText: string;
  className?: string;
}

export default function VerificationButton({
  verificationUrl,
  buttonText,
  className = "focus:shadow-outline w-full transform rounded-lg bg-gray-800 px-4 py-3 text-white transition-colors duration-300 ease-in-out hover:bg-gray-900 focus:outline-none",
}: VerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
  };

  return (
    <Link href={verificationUrl}>
      <Button className={className} onClick={handleClick} loading={isLoading}>
        {buttonText}
      </Button>
    </Link>
  );
}
