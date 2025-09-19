"use client";

import React, { ReactNode, createContext, useContext, useState } from "react";

import { type ChatSession } from "@/lib/swr/use-chat-sessions";

export interface ChatContextType {
  currentSession: ChatSession | null;
  setCurrentSession: (session: ChatSession | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [currentSession, setCurrentSessionState] = useState<ChatSession | null>(
    null,
  );

  const setCurrentSession = (session: ChatSession | null) => {
    setCurrentSessionState(session);
  };

  const value: ChatContextType = {
    currentSession,
    setCurrentSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
