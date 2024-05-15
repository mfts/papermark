"use client"; // Ensures this component is rendered on the client side

import { useEffect, useRef } from "react";

const DeckPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const setItem = (key: string, value: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "set", key, value },
      "https://shared.mfts.dev",
    );
  };

  useEffect(() => {
    // Example usage
    const exampleData = JSON.stringify({
      company: "Papermark",
      email: "test@test.com",
      description:
        "Papermark is a platform that helps you create and share beautiful pitch decks.",
      problem:
        "Creating pitch decks is time-consuming and requires design skills.",
      solution:
        "Papermark provides a simple drag-and-drop interface to create beautiful pitch decks.",
      mrr: "10,000",
      users: "100",
      metric2: "10",
      budget: "10,000",
      community: "Papermark Community",
      community1: "Papermark Community",
      special1: "Special 1",
      special2: "Special 2",
    });
    setItem("sharedKey", exampleData);
  }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        src="https://shared.mfts.dev"
        style={{
          width: 0,
          height: 0,
          border: "none",
          position: "absolute",
        }}
      />
      <div>
        <h1>Deck Page</h1>
        <p>This page sets a localStorage value in the shared iframe.</p>
      </div>
    </>
  );
};

export default DeckPage;
