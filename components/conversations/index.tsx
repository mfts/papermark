"use client";

import { ConversationListItem as ConversationListItemEE } from "@/ee/features/conversations/components/conversation-list-item";
import { ConversationMessage as ConversationMessageEE } from "@/ee/features/conversations/components/conversation-message";

export function ConversationListItem(props: any) {
  return <ConversationListItemEE {...props} />;
}

export function ConversationMessage(props: any) {
  return <ConversationMessageEE {...props} />;
}
