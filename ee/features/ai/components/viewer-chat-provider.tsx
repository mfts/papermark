"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ViewerChatConfig {
  dataroomId?: string;
  dataroomName?: string;
  documentId?: string;
  documentName?: string;
  linkId?: string;
  viewId?: string;
  viewerId?: string;
}

// interface FocusedDocument {
//   id: string;
//   name: string;
// }

interface ViewerChatContextType {
  // State
  isOpen: boolean;
  isEnabled: boolean;
  config: ViewerChatConfig;
  // focusedDocument: FocusedDocument | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  // setFocusedDocument: (doc: FocusedDocument | null) => void;
}

// ============================================================================
// Context
// ============================================================================

const ViewerChatContext = createContext<ViewerChatContextType | null>(null);

/**
 * Hook to access chat state and actions.
 * Throws if used outside ViewerChatProvider.
 */
export function useViewerChat() {
  const context = useContext(ViewerChatContext);
  if (!context) {
    throw new Error("useViewerChat must be used within ViewerChatProvider");
  }
  return context;
}

/**
 * Safe hook that returns null if not within ViewerChatProvider.
 * Useful for components that may or may not be within a chat context.
 */
export function useViewerChatSafe() {
  return useContext(ViewerChatContext);
}

// ============================================================================
// Provider
// ============================================================================

interface ViewerChatProviderProps {
  children: ReactNode;
  enabled?: boolean;
  dataroomId?: string;
  dataroomName?: string;
  documentId?: string;
  documentName?: string;
  linkId?: string;
  viewId?: string;
  viewerId?: string;
  // /** For dataroom document views - the currently focused document */
  // focusedDocumentId?: string;
  // focusedDocumentName?: string;
}

export function ViewerChatProvider({
  children,
  enabled = false,
  dataroomId,
  dataroomName,
  documentId,
  documentName,
  linkId,
  viewId,
  viewerId,
  // focusedDocumentId,
  // focusedDocumentName,
}: ViewerChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  // const [focusedDocument, setFocusedDocumentState] =
  // useState<FocusedDocument | null>(
  //   focusedDocumentId && focusedDocumentName
  //     ? { id: focusedDocumentId, name: focusedDocumentName }
  //     : null,
  // );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  // const setFocusedDocument = useCallback(
  //   (doc: FocusedDocument | null) => setFocusedDocumentState(doc),
  //   [],
  // );

  const config: ViewerChatConfig = {
    dataroomId,
    dataroomName,
    documentId,
    documentName,
    linkId,
    viewId,
    viewerId,
  };

  const value: ViewerChatContextType = {
    isOpen,
    isEnabled: enabled,
    config,
    // focusedDocument,
    open,
    close,
    toggle,
    // setFocusedDocument,
  };

  return (
    <ViewerChatContext.Provider value={value}>
      {children}
    </ViewerChatContext.Provider>
  );
}

// ============================================================================
// Layout Component - Applies padding when chat is open
// ============================================================================

interface ViewerChatLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layout wrapper that applies padding when chat panel is open.
 * Use this to wrap content that should shrink when chat opens.
 */
export function ViewerChatLayout({
  children,
  className,
}: ViewerChatLayoutProps) {
  const context = useViewerChatSafe();

  // If not in provider or not enabled, just render children
  if (!context || !context.isEnabled) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "transition-all duration-300",
        context.isOpen && "pr-[400px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
