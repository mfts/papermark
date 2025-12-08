"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { Sparkles, ArrowRight } from "lucide-react";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { YearlyRecapModal } from "./yearly-recap-modal";

// Decorative SVG Components
const DocumentStackSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="60" height="80" rx="2" fill="#FA7A02" opacity="0.4" />
    <rect x="15" y="20" width="60" height="80" rx="2" fill="#FA7A02" opacity="0.5" />
    <rect x="20" y="30" width="60" height="80" rx="2" fill="#FA7A02" opacity="0.6" />
  </svg>
);

const PeachPaperSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 15 Q15 10, 20 15 L45 40 Q50 45, 45 50 L20 50 Q15 50, 10 45 Z" fill="#FFD4B3" opacity="0.6" />
    <path d="M10 15 Q12 12, 15 15 L40 40 Q42 42, 40 45 L15 45 Q12 45, 10 42 Z" fill="#FFD4B3" opacity="0.4" />
  </svg>
);

const ScatterDotsSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="30" r="2" fill="#D3D3D3" opacity="0.5" />
    <circle cx="45" cy="25" r="1.5" fill="#D3D3D3" opacity="0.5" />
    <circle cx="65" cy="35" r="2" fill="#D3D3D3" opacity="0.5" />
    <circle cx="30" cy="55" r="1.5" fill="#D3D3D3" opacity="0.5" />
    <circle cx="55" cy="60" r="2" fill="#D3D3D3" opacity="0.5" />
    <circle cx="70" cy="70" r="1.5" fill="#D3D3D3" opacity="0.5" />
  </svg>
);

interface YearlyRecapStats {
  year: number;
  totalViews: number;
  totalDocuments: number;
  totalDatarooms: number;
}

export function YearlyRecapBanner() {
  const teamInfo = useTeam();
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [showModal, setShowModal] = useState(false);

  const { data: stats } = useSWR<YearlyRecapStats>(
    teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/yearly-recap`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  // Check if URL has openRecap parameter - open modal regardless of stats
  useEffect(() => {
    if (router.isReady && router.query.openRecap === "true" && teamInfo?.currentTeam?.id) {
      setShowModal(true);
      // Remove the query parameter
      const { openRecap, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.isReady, router.query.openRecap, teamInfo?.currentTeam?.id, router]);

  const handleOpenModal = () => {
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
        <div className="relative overflow-hidden rounded-xl p-6" style={{
          background: "linear-gradient(to right, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 25%, #EEEFEB 50%, rgba(16, 185, 129, 0.1) 75%, rgba(16, 185, 129, 0.2) 100%)"
        }}>
          {/* Decorative elements */}
          <DocumentStackSVG className="absolute -top-2 -right-2 w-24 h-28" />
          {/* <PeachPaperSVG className="absolute bottom-2 left-2 w-16 h-16" /> */}
          <ScatterDotsSVG className="absolute top-2 left-1/4 w-20 h-20" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 shrink-0">
                {/* <PeachPaperSVG className="absolute inset-0 w-full h-full opacity-60" /> */}
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xl">Papermark Wrapped {currentYear}</h3>
                <p className="text-gray-600 text-sm">
                  {stats ? (
                    <>See your highlights: {stats.totalViews.toLocaleString()} views, {stats.totalDocuments} documents, {stats.totalDatarooms} datarooms</>
                  ) : (
                    "Your year in document sharing"
                  )}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleOpenModal} 
              className="bg-gray-900 hover:bg-black text-white gap-2 shrink-0"
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

