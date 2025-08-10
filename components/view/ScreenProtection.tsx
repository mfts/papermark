import { useState, useEffect } from "react";

import { XOctagonIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "@/components/ui/button";

export const ScreenProtector = () => {
  const [blockScreen, setBlockScreen] = useState<boolean>(false);

  // Enhanced screenshot key detection for Windows, Linux, and macOS
  // Detecting PrintScreen key alone (most common for third-party apps on Windows)
  useHotkeys("printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  // Windows screenshot combinations
  useHotkeys("alt+printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  useHotkeys("win+printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  useHotkeys("win+shift+s", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  // macOS screenshot combinations  
  useHotkeys("cmd+shift+3", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  useHotkeys("cmd+shift+4", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  useHotkeys("cmd+shift+5", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  // Linux screenshot combinations (common ones)
  useHotkeys("shift+printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  useHotkeys("ctrl+alt+printscreen", (event) => {
    setBlockScreen(true);
    event.preventDefault();
  }, { enableOnFormTags: true });

  // Additional detection method using visibility change and clipboard monitoring
  useEffect(() => {
    let clipboardChangeDetected = false;

    // Monitor window visibility changes which might indicate screenshot activity
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Small delay to check if clipboard was accessed after visibility change
        setTimeout(() => {
          if (clipboardChangeDetected) {
            setBlockScreen(true);
            clipboardChangeDetected = false;
          }
        }, 100);
      }
    };

    // Monitor potential clipboard access (when available)
    const monitorClipboard = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          // This is a basic attempt - clipboard monitoring is limited in browsers
          // but can help detect some screenshot activities
          const checkClipboard = async () => {
            try {
              await navigator.clipboard.readText();
              clipboardChangeDetected = true;
            } catch (error) {
              // Clipboard access denied or empty, which is expected
            }
          };
          
          // Check clipboard periodically when document is visible
          const clipboardInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
              checkClipboard();
            }
          }, 1000);

          return () => clearInterval(clipboardInterval);
        }
      } catch (error) {
        // Clipboard API not available or restricted
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const cleanupClipboard = monitorClipboard();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cleanupClipboard) {
        cleanupClipboard.then(cleanup => cleanup?.());
      }
    };
  }, []);

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
