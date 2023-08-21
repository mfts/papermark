import React, { useState, useEffect } from "react";

interface FeedbackProps {
  onUpvote: () => void;
  onDownvote: () => void;
}

const Feedback: React.FC<FeedbackProps> = ({ onUpvote, onDownvote }) => {
  const [flyEmojis, setFlyEmojis] = useState<
    Array<{ emoji: string; delay: number; id: number }>
  >([]);
  const [questionPopup, setQuestionPopup] = useState(false);
  const [showDeckMessage, setShowDeckMessage] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(true);

  useEffect(() => {
    // If no feedback provided, make the comment emoji button blink after 10 seconds
    if (!feedbackGiven) {
      const blinkTimeout = setTimeout(() => {
        // Add logic to make the "💬" emoji blink 3 times
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
          const questionButton = document.querySelector(
            "button[data-emoji='💬']"
          );
          if (questionButton) {
            questionButton.classList.toggle("blink-effect");
          }
          blinkCount++;
          if (blinkCount === 6) {
            clearInterval(blinkInterval);
            if (questionButton) {
              questionButton.classList.remove("blink-effect");
            }
          }
        }, 500); // Blink every half second
      }, 10 * 1000); // 10 seconds

      return () => clearTimeout(blinkTimeout);
    }
  }, [feedbackGiven]);

  const handleEmojiClick = (emoji: string, callback: () => void) => {
    setFeedbackGiven(true); // Register that feedback was provided
    const timestamp = Date.now(); // Unique identifier for this set of emojis

    const newEmojis = [
      { emoji, delay: 0, id: timestamp },
      { emoji, delay: 1, id: timestamp + 1 },
      { emoji, delay: 2, id: timestamp + 2 },
    ];

    setFlyEmojis((prevEmojis) => [...prevEmojis, ...newEmojis]);
    callback();

    setTimeout(() => {
      setFlyEmojis((prevEmojis) =>
        prevEmojis.filter((emojiObj) => !newEmojis.includes(emojiObj))
      );
    }, 4000); // Clear after 4 seconds
  };

  const tooltips = {
    "👍": "Like it",
    "👎": "Not good",
    "💸": "Take my money",
    "💬": "I have a question",
    "📥": "Receive more decks like this",
  };

  return (
    <div className="relative flex justify-center items-center bottom-3 space-x-2 p-1 left-1/2 transform -translate-x-1/2">
      <div className="fixed bottom-2.5 left-1/2 transform -translate-x-1/2 z-10 bg-white bg-opacity-70 rounded-md px-2.5 py-1.5 space-x-2 w-x">
        {Object.entries(tooltips).map(([emoji, tooltip]) => (
          <div className="relative inline-block" key={emoji}>
            <button
              data-emoji={emoji}
              onClick={() => {
                if (emoji === "💬") {
                  setQuestionPopup((prevState) => !prevState); // Toggle the questionPopup state
                } else if (emoji === "📥") {
                  setShowDeckMessage(true);
                  setTimeout(() => setShowDeckMessage(false), 2000);
                } else {
                  handleEmojiClick(
                    emoji,
                    emoji === "👍" ? onUpvote : onDownvote
                  );
                }
              }}
              className="focus:outline-none p-1 hover:bg-gray-200 rounded-full relative"
              onMouseEnter={() => {
                setHoveredEmoji(emoji);
                setFeedbackGiven(true); // Register hover as feedback
              }}
              onMouseLeave={() => setHoveredEmoji(null)}
            >
              {(emoji === "👍" || emoji === "👎" || emoji === "💸") &&
                flyEmojis.map((emojiObj) =>
                  emojiObj.emoji === emoji ? (
                    <span
                      key={emojiObj.id}
                      className={`absolute -top-8 left-0 right-0 mx-auto animate-flyEmoji duration-3000 delay-${
                        emojiObj.delay * 1000
                      }`}
                    >
                      {emojiObj.emoji}
                    </span>
                  ) : null
                )}
              {emoji}
            </button>
            {hoveredEmoji === emoji && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap bg-white bg-opacity-70 rounded px-1 text-gray-600">
                {tooltip}
              </div>
            )}
          </div>
        ))}

        {questionPopup && (
          <div className="relative inline-block flex justify-center items-center bottom-3 space-x-2 p-1 left-1/2 ">
            <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-10 bg-white bg-opacity-70 rounded-md px-2.5 py-2 w-64">
              {showFeedbackForm ? (
                <>
                  <textarea
                    className="w-full h-36 px-3 py-2 mb-2 border rounded text-gray-700" // Dark grey text
                    placeholder="Leave your comment or question..."
                  />
                  <div className="text-right">
                    {" "}
                    <button
                      onClick={() => {
                        setShowFeedbackForm(false); // Hide the textarea and button
                        setTimeout(() => {
                          setShowFeedbackForm(true);
                          setQuestionPopup(false); // Close the popup after 5 seconds
                        }, 5000);
                      }}
                      className="px-4 py-1 bg-gray-400 text-gray-700 rounded hover:bg-gray-500"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-24 flex flex-col justify-center items-center text-gray-700">
                  {" "}
                  Thank you. Your feedback sent to the owner of the document.
                </div>
              )}
            </div>
          </div>
        )}

        {showDeckMessage && (
          <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-10 bg-white bg-opacity-70 rounded px-2 py-2 whitespace-nowrap text-s text-black">
            You will receive more decks like this in your inbox.
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
