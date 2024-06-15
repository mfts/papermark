import { useState } from "react";

import { XOctagonIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "@/components/ui/button";

export const ScreenProtector = () => {
  const [blockScreen, setBlockScreen] = useState<boolean>(false);

  // Key combinations for screenshot in Windows, Linux, and macOS
  useHotkeys("meta+shift, alt, printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  });

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
