import { useEffect, useRef, useState } from "react";
import { REACTIONS } from "@/lib/constants";
import GripVertical from "../shared/icons/grip-vertical";
import Draggable from "react-draggable";

export default function Toolbar({
  viewId,
  pageNumber,
}: {
  viewId: string;
  pageNumber: number;
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
        className="font-emoji text-xl leading-6 bg-transparent py-1 px-1.5 relative transition-bg-color duration-600 inline-flex justify-center items-center align-middle rounded-full ease-in-out hover:bg-gray-200 active:bg-gray-400 active:duration-0"
        role="img"
        aria-label={label ? label : ""}
        aria-hidden={label ? "false" : "true"}
        onClick={() => handleEmojiClick(emoji, label)}
      >
        {emoji}
        {currentEmoji && currentEmoji.emoji === emoji && (
          <span
            key={currentEmoji.id}
            className="font-emoji absolute -top-10 left-0 right-0 mx-auto animate-flyEmoji duration-3000"
          >
            {currentEmoji.emoji}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      <div
        className="fixed top-16 left-0 w-dvw justify-center items-end flex z-10"
        style={{ height: "calc(100vh - 64px)" }}
      >
        <Draggable bounds="parent" handle=".moveable-icon">
          <div className="bg-gray-950/40 rounded-full w-max mt-4 mb-4">
            <div className="grid items-center justify-start">
              <div className="px-2 py-1">
                <div className="grid items-center justify-start grid-flow-col">
                  {REACTIONS.map((reaction) => (
                    <Emoji
                      key={reaction.emoji}
                      emoji={reaction.emoji}
                      label={reaction.label}
                    />
                  ))}
                  <GripVertical className="h-5 w-5 text-gray-100 active:text-gray-300 moveable-icon" />
                </div>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
}
