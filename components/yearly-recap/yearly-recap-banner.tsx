"use client";

import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowRight, Sparkles } from "lucide-react";

import { useAnalytics } from "@/lib/analytics";

import { Button } from "@/components/ui/button";

import { YearlyRecapModal } from "./yearly-recap-modal";

// Decorative SVG Components
const DocumentStackSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="10"
      y="10"
      width="60"
      height="80"
      rx="2"
      fill="#FA7A02"
      opacity="0.4"
    />
    <rect
      x="15"
      y="20"
      width="60"
      height="80"
      rx="2"
      fill="#FA7A02"
      opacity="0.5"
    />
    <rect
      x="20"
      y="30"
      width="60"
      height="80"
      rx="2"
      fill="#FA7A02"
      opacity="0.6"
    />
  </svg>
);

const PeachPaperSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 15 Q15 10, 20 15 L45 40 Q50 45, 45 50 L20 50 Q15 50, 10 45 Z"
      fill="#FFD4B3"
      opacity="0.6"
    />
    <path
      d="M10 15 Q12 12, 15 15 L40 40 Q42 42, 40 45 L15 45 Q12 45, 10 42 Z"
      fill="#FFD4B3"
      opacity="0.4"
    />
  </svg>
);

const ScatterDotsSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="25" cy="30" r="2" fill="#D3D3D3" opacity="0.5" />
    <circle cx="45" cy="25" r="1.5" fill="#D3D3D3" opacity="0.5" />
    <circle cx="65" cy="35" r="2" fill="#D3D3D3" opacity="0.5" />
    <circle cx="30" cy="55" r="1.5" fill="#D3D3D3" opacity="0.5" />
    <circle cx="55" cy="60" r="2" fill="#D3D3D3" opacity="0.5" />
    <circle cx="70" cy="70" r="1.5" fill="#D3D3D3" opacity="0.5" />
  </svg>
);

export function YearlyRecapBanner() {
  const teamInfo = useTeam();
  const router = useRouter();
  const analytics = useAnalytics();
  const currentYear = new Date().getFullYear();
  const [showModal, setShowModal] = useState(false);

  // Check if URL has openRecap parameter - open modal regardless of stats
  useEffect(() => {
    if (
      router.isReady &&
      router.query.openRecap === "true" &&
      teamInfo?.currentTeam?.id
    ) {
      setShowModal(true);
      // Remove the query parameter
      const { openRecap, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.isReady, router.query.openRecap, teamInfo?.currentTeam?.id]);

  const handleOpenModal = () => {
    analytics.capture("YIR: Banner Opened", {
      teamId: teamInfo?.currentTeam?.id,
      source: "banner",
    });
    setShowModal(true);
  };

  // Don't render anything if no team
  if (!teamInfo?.currentTeam?.id) {
    return null;
  }

  return (
    <>
      {/* Modal - always available */}
      <YearlyRecapModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        teamId={teamInfo.currentTeam.id}
      />

      {/* Banner - always shown */}
      <div className="mx-2 my-2 mb-2">
        <div
          className="relative overflow-hidden rounded-xl p-4 sm:p-6"
          style={{
            background:
              "linear-gradient(to right, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 25%, #EEEFEB 50%, rgba(16, 185, 129, 0.1) 75%, rgba(16, 185, 129, 0.2) 100%)",
          }}
        >
          {/* Decorative elements */}
          <DocumentStackSVG className="absolute -right-2 -top-2 h-28 w-24" />
          {/* <PeachPaperSVG className="absolute bottom-2 left-2 w-16 h-16" /> */}
          <ScatterDotsSVG className="absolute left-1/4 top-2 h-20 w-20" />

          <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative h-10 w-10 shrink-0 sm:h-12 sm:w-12">
                {/* <PeachPaperSVG className="absolute inset-0 w-full h-full opacity-60" /> */}
                <div className="absolute inset-0 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 sm:h-12 sm:w-12">
                  <Sparkles className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">
                  Papermark Wrapped {currentYear}
                </h3>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Your year in document sharing
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpenModal}
              className="w-full shrink-0 gap-2 bg-gray-900 text-white hover:bg-black sm:w-auto"
            >
              See your Wrapped
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
