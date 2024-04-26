import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export const ScreenProtector = () => {
  const [blockScreen, setBlockScreen] = useState<boolean>(false);

  // Key combinations for screenshot in Windows, Linux, and macOS
  useHotkeys(
    "mod+shift+3, mod+shift+4, mod+shift+5, mod+shift+6, alt+printscreen, printscreen, mod+ctrl+shift+3, mod+ctrl+shift+4",
    (event) => {
      setBlockScreen(true);
      // Set timeout to hide the block screen after a delay
      setTimeout(() => {
        setBlockScreen(false);
      }, 500); // Display the white screen for 2 seconds
      event.preventDefault();
    },
  );

  if (blockScreen) {
    return <div className="absolute bg-white inset-0 w-screen h-screen"></div>;
  }
  return null;
};
