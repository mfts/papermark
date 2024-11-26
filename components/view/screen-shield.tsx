"use client";

import { useCallback, useEffect, useState } from "react";

import { CircleHelpIcon } from "lucide-react";

import { ButtonTooltip } from "../ui/tooltip";

export function ScreenShield({
  visiblePercentage = 35,
}: {
  visiblePercentage?: number;
}) {
  const navbarHeight = 64;
  const minShieldHeight = 32;

  const navbarHeightVh = (navbarHeight / window.innerHeight) * 100;
  const minShieldHeightVh = (minShieldHeight / window.innerHeight) * 100;

  const availableHeight = 100 - navbarHeightVh;

  const [handlePosition, setHandlePosition] = useState(
    (availableHeight - visiblePercentage) / 2,
  );

  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setStartY("touches" in e ? e.touches[0].clientY : e.clientY);
  };

  const handleMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const delta = clientY - startY;
      const viewportHeight = window.innerHeight;
      const deltaPercentage = (delta / viewportHeight) * 100;

      const newPosition = Math.min(
        availableHeight - visiblePercentage - minShieldHeightVh,
        Math.max(minShieldHeightVh, handlePosition + deltaPercentage),
      );

      setHandlePosition(newPosition);
      setStartY(clientY);
    },
    [isDragging, startY, handlePosition, availableHeight, visiblePercentage],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientY);
    },
    [handleMove],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleMove(e.touches[0].clientY);
    },
    [handleMove],
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  const patternBg = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0zm0 10L10 30l20 20 20-20-20-20z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`;

  console.log("total height", availableHeight);
  console.log("handle position", handlePosition);
  console.log("visible percentage", visiblePercentage);

  return (
    <>
      {/* Top Shield */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-x-0 top-16 w-full origin-top cursor-move bg-black/90 backdrop-blur-sm transition-transform duration-300 ease-out"
        style={{
          height: `${handlePosition}svh`,
          backgroundImage: patternBg,
          backgroundSize: "30px 30px",
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className="absolute inset-x-0 bottom-0 cursor-move bg-black/90 p-2 text-center text-white hover:bg-gray-500 hover:opacity-80"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="select-none text-xs font-medium">
              PRIVATE AND CONFIDENTIAL
            </span>
            <ButtonTooltip
              content="The sender has reduced the viewing area to protect the contents of this confidential file. Click and drag this bar to adjust your view."
              sideOffset={16}
            >
              <CircleHelpIcon className="h-4 w-4" />
            </ButtonTooltip>
          </div>
        </div>
      </div>

      {/* Bottom Shield */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-x-0 bottom-0 w-full origin-bottom cursor-move bg-black/90 backdrop-blur-sm transition-transform duration-300 ease-out"
        style={{
          height: `${availableHeight - visiblePercentage - handlePosition}svh`,
          backgroundImage: patternBg,
          backgroundSize: "30px 30px",
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className="absolute inset-x-0 top-0 cursor-move bg-black/90 p-2 text-center text-white hover:bg-gray-500 hover:opacity-80"
        >
          <div className="select-none text-xs">
            <span>Drag to adjust view</span>
          </div>
        </div>
      </div>
    </>
  );
}
