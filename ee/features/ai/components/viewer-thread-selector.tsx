"use client";

import { useMemo } from "react";

import {
  differenceInDays,
  format,
  isThisWeek,
  isToday,
  startOfDay,
} from "date-fns";
import {
  ChevronDown,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import useSWR from "swr";

import { cn, fetcher } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Chat {
  id: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  messages?: { content: string }[];
}

interface GroupedChats {
  today: Chat[];
  thisWeek: Chat[];
  older: Chat[];
}

interface ViewerThreadSelectorProps {
  currentChatId: string | null;
  currentChatTitle?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (chatId: string) => void;
  documentId?: string;
  dataroomId?: string;
  linkId?: string;
  viewerId?: string;
  viewId?: string;
}

function groupChatsByDate(chats: Chat[]): GroupedChats {
  const grouped: GroupedChats = {
    today: [],
    thisWeek: [],
    older: [],
  };

  const now = new Date();

  chats.forEach((chat) => {
    const chatDate = new Date(chat.lastMessageAt || chat.createdAt);

    if (isToday(chatDate)) {
      grouped.today.push(chat);
    } else if (isThisWeek(chatDate, { weekStartsOn: 1 })) {
      grouped.thisWeek.push(chat);
    } else {
      grouped.older.push(chat);
    }
  });

  return grouped;
}

function getChatDisplayTitle(chat: Chat): string {
  if (chat.title) return chat.title;
  if (chat.messages?.[0]?.content) {
    const preview = chat.messages[0].content.slice(0, 40);
    return preview.length < chat.messages[0].content.length
      ? `${preview}...`
      : preview;
  }
  return "New Chat";
}

export function ViewerThreadSelector({
  currentChatId,
  currentChatTitle,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  documentId,
  dataroomId,
  linkId,
  viewerId,
  viewId,
}: ViewerThreadSelectorProps) {
  // Build query params for viewer-based chat listing
  const params = new URLSearchParams();
  if (viewerId) params.append("viewerId", viewerId);
  if (documentId) params.append("documentId", documentId);
  if (dataroomId) params.append("dataroomId", dataroomId);
  if (linkId) params.append("linkId", linkId);
  if (viewId) params.append("viewId", viewId);

  const shouldFetch = viewerId && (documentId || dataroomId);

  const {
    data: chats,
    isLoading,
    mutate,
  } = useSWR<Chat[]>(
    shouldFetch ? `/api/ai/chat?${params.toString()}` : null,
    fetcher,
  );

  const groupedChats = useMemo(() => {
    if (!chats) return { today: [], thisWeek: [], older: [] };
    return groupChatsByDate(chats);
  }, [chats]);

  const currentChat = chats?.find((chat) => chat.id === currentChatId);
  const displayTitle =
    currentChatTitle ||
    getChatDisplayTitle(currentChat || ({} as Chat)) ||
    "New Chat";

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteChat) {
      onDeleteChat(chatId);
    }
    // If deleting current chat, trigger new chat
    if (chatId === currentChatId) {
      onNewChat();
    }
    // Optimistically update the list
    mutate(
      chats?.filter((c) => c.id !== chatId),
      false,
    );
  };

  const renderChatItem = (chat: Chat) => (
    <DropdownMenuItem
      key={chat.id}
      onClick={() => onSelectChat(chat.id)}
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-2",
        chat.id === currentChatId && "bg-gray-100",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium">
          {getChatDisplayTitle(chat)}
        </p>
        <p className="text-xs text-gray-500">
          {format(
            new Date(chat.lastMessageAt || chat.createdAt),
            "MMM d, h:mm a",
          )}
        </p>
      </div>
      {onDeleteChat && (
        <Button
          variant="ghost"
          size="sm"
          className="size-6 p-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => handleDeleteChat(chat.id, e)}
        >
          <Trash2 className="size-3.5 text-gray-500 hover:text-red-500" />
        </Button>
      )}
    </DropdownMenuItem>
  );

  const hasChats =
    groupedChats.today.length > 0 ||
    groupedChats.thisWeek.length > 0 ||
    groupedChats.older.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 max-w-[180px] gap-1.5 px-2 hover:bg-gray-100"
        >
          <MessageSquare className="size-4 shrink-0" />
          <span className="truncate text-sm font-medium">{displayTitle}</span>
          <ChevronDown className="size-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-full">
        <div className="max-h-[400px] overflow-y-auto">
          {hasChats && !isLoading ? (
            <>
              {/* Today */}
              {groupedChats.today.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                    Today
                  </DropdownMenuLabel>
                  {groupedChats.today.map(renderChatItem)}
                </>
              )}

              {/* This Week */}
              {groupedChats.thisWeek.length > 0 && (
                <>
                  {groupedChats.today.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                    This Week
                  </DropdownMenuLabel>
                  {groupedChats.thisWeek.map(renderChatItem)}
                </>
              )}

              {/* Older */}
              {groupedChats.older.length > 0 && (
                <>
                  {(groupedChats.today.length > 0 ||
                    groupedChats.thisWeek.length > 0) && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                    Older
                  </DropdownMenuLabel>
                  {groupedChats.older.map(renderChatItem)}
                </>
              )}
            </>
          ) : isLoading ? (
            <div className="flex items-center gap-2 p-4">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm text-gray-500">
                Loading chat history...
              </span>
            </div>
          ) : (
            <div className="px-2 py-4 text-center text-sm text-gray-500">
              No chat history yet
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
