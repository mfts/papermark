import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import UserRound from "../shared/icons/user-round";
import { REACTIONS } from "@/lib/constants";
import { set } from "date-fns";

function getKeyByValue(object: { [x: string]: any }, value: any) {
  return Object.keys(object).find((key) => object[key] === value);
}

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

  const handleEmojiClick = async (emoji: string) => {
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
        type: getKeyByValue(REACTIONS, emoji) as string,
        pageNumber: pageNumber,
      }),
    });
  };

  const Emoji = (props: any) => (
    <button
      className="emoji text-2xl leading-6 hover:bg-gray-800 rounded-full p-2"
      role="img"
      aria-label={props.label ? props.label : ""}
      aria-hidden={props.label ? "false" : "true"}
      onClick={() => handleEmojiClick(props.symbol)}
    >
      {/* {(props.symbol === "👍" ||
        props.symbol === "👎" ||
        props.symbol === "❤️" ||
        props.symbol === "💸") &&
        flyEmojis === props.symbol && (
          <span
            className={`absolute -top-10 left-0 right-0 mx-auto animate-flyEmoji duration-3000`}
          >
            {flyEmojis}
          </span>
        )} */}
      {props.symbol}
      {currentEmoji && currentEmoji.emoji === props.symbol && (
        <span
          key={currentEmoji.id}
          className="absolute -top-10 left-0 right-0 mx-auto animate-flyEmoji duration-3000"
        >
          {currentEmoji.emoji}
        </span>
      )}
    </button>
  );

  return (
    <>
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-950/50 rounded-full py-1 px-4 flex items-center justify-start space-x-2 shadow-lg z-10">
        <div className="p-1 rounded-full bg-emerald-500 -ml-2">
          <Avatar className="h-6 w-6">
            {/* <AvatarImage src= /> */}
            <AvatarFallback>
              <UserRound />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center">
          <Emoji symbol="❤️" label="heart" />
          <Emoji symbol="💸" label="money" />
          <Emoji symbol="👍" label="thumbs-up" />
          <Emoji symbol="👎" label="thumbs-down" />
        </div>
      </div>
    </>
  );
}
