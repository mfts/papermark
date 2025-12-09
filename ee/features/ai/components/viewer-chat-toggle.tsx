"use client";

import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useViewerChatSafe } from "./viewer-chat-provider";

interface ViewerChatToggleProps {
  className?: string;
}

/**
 * Floating toggle button for the chat panel.
 * Only renders when chat is enabled and closed.
 * Place this anywhere in the component tree within ViewerChatProvider.
 */
export function ViewerChatToggle({ className }: ViewerChatToggleProps) {
  const context = useViewerChatSafe();

  // Don't render if not in provider, not enabled, or already open
  if (!context || !context.isEnabled || context.isOpen) {
    return null;
  }

  return (
    <Button
      onClick={context.open}
      className="fixed bottom-4 right-4 z-40 gap-2 rounded-full shadow-lg"
      size="lg"
    >
      <MessageSquare className="size-5" />
      AI Chat
    </Button>
  );
}

