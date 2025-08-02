"use client";

import {
  ConversationSidebarProps,
  ConversationViewSidebar as ConversationViewSidebarEE,
} from "@/ee/features/conversations/components/viewer/conversation-view-sidebar";

export function ConversationSidebar(props: ConversationSidebarProps) {
  return <ConversationViewSidebarEE {...props} />;
}
