import { useState } from "react";

import { XOctagonIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "@/components/ui/button";

export const ScreenProtector = () => {
  const [blockScreen, setBlockScreen] = useState<boolean>(false);

  // Comprehensive screenshot prevention for all major platforms
  const handleScreenshotAttempt = (event: KeyboardEvent) => {
    setBlockScreen(true);
    event.preventDefault();
    event.stopPropagation();
  };

  // Windows screenshot shortcuts
  useHotkeys(
    [
      "printscreen", // PrintScreen key
      "alt+printscreen", // Alt + PrintScreen (active window)
      "meta+printscreen", // Win + PrintScreen (save to file)
      "meta+shift+s", // Win + Shift + S (Snipping Tool)
      "meta+g", // Win + G (Game Bar)
    ],
    handleScreenshotAttempt,
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // macOS screenshot shortcuts
  useHotkeys(
    [
      "meta+shift",
      "meta+shift+3", // Cmd + Shift + 3 (full screen)
      "meta+shift+4", // Cmd + Shift + 4 (selection)
      "meta+shift+5", // Cmd + Shift + 5 (screenshot utility)
      "meta+shift+4+space", // Cmd + Shift + 4 + Space (window)
    ],
    handleScreenshotAttempt,
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // Linux screenshot shortcuts
  useHotkeys(
    [
      "shift+printscreen", // Shift + PrintScreen (selection in some Linux distros)
      "ctrl+alt+printscreen", // Ctrl + Alt + PrintScreen (some Linux distros)
    ],
    handleScreenshotAttempt,
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // Developer tools that could be used for screenshots
  useHotkeys(
    [
      "f12", // F12 (Developer Tools)
      "ctrl+shift+i", // Ctrl + Shift + I (Developer Tools)
      "meta+alt+i", // Cmd + Option + I (macOS Developer Tools)
      "ctrl+shift+c", // Ctrl + Shift + C (Inspect Element)
      "meta+alt+c", // Cmd + Option + C (macOS Inspect Element)
    ],
    handleScreenshotAttempt,
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  if (blockScreen) {
    return (
      <div className="absolute inset-0 z-50 flex w-screen items-center justify-center bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <XOctagonIcon className="size-5 text-destructive" />
            <p className="text-sm text-destructive">
              Screenshot is not allowed.
            </p>
          </div>
          <Button size="sm" onClick={() => setBlockScreen(false)}>
            Back to document
          </Button>
        </div>
      </div>
    );
  }

  // will be hidden unless user prints the screen
  return (
    <div className="absolute inset-0 hidden h-screen w-screen bg-white print:block"></div>
  );
};
