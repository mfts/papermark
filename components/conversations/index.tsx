"use client";

import { ConversationListItem as ConversationListItemEE } from "@/ee/features/conversations/components/dashboard/conversation-list-item";
import { ConversationMessage as ConversationMessageEE } from "@/ee/features/conversations/components/shared/conversation-message";

export function ConversationListItem(props: any) {
  return <ConversationListItemEE {...props} />;
}

export function ConversationMessage(props: any) {
  return <ConversationMessageEE {...props} />;
}
