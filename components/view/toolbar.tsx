import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";
import Draggable from "react-draggable";

import { REACTIONS } from "@/lib/constants";

import GripVertical from "../shared/icons/grip-vertical";

export default function Toolbar({
  viewId,
  pageNumber,
  isPreview,
}: {
  viewId?: string;
  pageNumber: number;
  isPreview?: boolean;
}) {
  const [currentEmoji, setCurrentEmoji] = useState<{
    emoji: string;
    id: number;
  } | null>(null);
  const clearEmojiTimeout = useRef<any>(null);

  useEffect(() => {
    setCurrentEmoji(null);
  }, [pageNumber]);

  useEffect(() => {
    return () => {
      if (clearEmojiTimeout.current) {
        clearTimeout(clearEmojiTimeout.current);
      }
    };
  }, []);

  const handleEmojiClick = async (emoji: string, label: string) => {
    // Clear any existing timeout
    if (clearEmojiTimeout.current) {
      clearTimeout(clearEmojiTimeout.current);
    }

    // Set the current emoji with a unique identifier
    setCurrentEmoji({ emoji, id: Date.now() });

    // Remove the emoji after the animation duration
    clearEmojiTimeout.current = setTimeout(() => {
      setCurrentEmoji(null);
    }, 3000); // Adjust this duration to match your animation

    // skip recording reactions if in preview mode
    if (isPreview) return;

    await fetch("/api/record_reaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        viewId: viewId,
        type: label,
        pageNumber: pageNumber,
      }),
    });
  };

  const Emoji = ({ label, emoji }: { label: string; emoji: string }) => (
    <div className="relative w-fit">
      <button
        className="font-emoji transition-bg-color duration-600 relative inline-flex items-center justify-center rounded-full bg-transparent px-1.5 py-1 align-middle text-xl leading-6 ease-in-out hover:bg-gray-200 active:bg-gray-400 active:duration-0"
        role="img"
        aria-label={label ? label : ""}
        aria-hidden={label ? "false" : "true"}
        onClick={() => handleEmojiClick(emoji, label)}
      >
        {emoji}
        {currentEmoji && currentEmoji.emoji === emoji && (
          <span
            key={currentEmoji.id}
            className="font-emoji duration-3000 absolute -top-10 left-0 right-0 mx-auto animate-flyEmoji"
          >
            {currentEmoji.emoji}
          </span>
        )}
      </button>
    </div>
  );

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50">
      <Draggable bounds="parent" handle=".moveable-icon">
        <div className="pointer-events-auto absolute bottom-4 left-[45%] w-max -translate-x-1/2 transform rounded-full bg-gray-950/40">
          <div className="grid items-center justify-start">
            <div className="px-2 py-1">
              <div className="grid grid-flow-col items-center justify-start">
                {REACTIONS.map((reaction) => (
                  <Emoji
                    key={reaction.emoji}
                    emoji={reaction.emoji}
                    label={reaction.label}
                  />
                ))}
                <GripVertical className="moveable-icon h-5 w-5 text-gray-100 active:text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </Draggable>
    </div>,
    document.body,
  );
}
