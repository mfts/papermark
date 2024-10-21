"use client";

import Image from "next/image";

import * as React from "react";

import * as ScrollArea from "@radix-ui/react-scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export default function ImageCarousel({
  images,
  className,
}: ImageCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-4xl", className)}>
      <ScrollArea.Root className="w-full overflow-hidden">
        <ScrollArea.Viewport
          ref={scrollContainerRef}
          className="w-full overflow-x-scroll"
        >
          <div className="flex space-x-4 p-4">
            {images.map((src, index) => (
              <div
                key={index}
                className="relative h-64 w-96 flex-shrink-0 overflow-hidden rounded-lg"
              >
                <Image
                  src={src}
                  alt={`Slide ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </ScrollArea.Viewport>
        {/* <ScrollArea.Scrollbar
          orientation="horizontal"
          className="flex h-2.5 touch-none select-none bg-black/20 transition-colors duration-150 ease-out hover:bg-black/30"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-white" />
        </ScrollArea.Scrollbar> */}
      </ScrollArea.Root>
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow-md transition-all duration-200 ease-in-out hover:bg-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow-md transition-all duration-200 ease-in-out hover:bg-white"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
