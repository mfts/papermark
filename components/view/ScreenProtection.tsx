import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { XOctagonIcon } from "lucide-react";

export const ScreenProtector = () => {
  const [blockScreen, setBlockScreen] = useState<boolean>(false);

  // Key combinations for screenshot in Windows, Linux, and macOS
  useHotkeys("meta+shift, alt, printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  });

  if (blockScreen) {
    return (
      <div className="absolute bg-white inset-0 w-screen h-screen flex items-center justify-center z-50">
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
    <div className="absolute bg-white inset-0 w-screen h-screen hidden print:block"></div>
  );
};
