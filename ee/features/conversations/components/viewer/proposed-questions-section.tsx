"use client";

import { useState } from "react";

import { CheckCircle2Icon, ChevronRightIcon } from "lucide-react";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProposedQuestion {
  id: string;
  question: string;
  description: string | null;
  orderIndex: number;
  hasResponded: boolean;
  conversationId: string | null;
  createdAt: string;
  document?: {
    name: string;
  };
}

interface ProposedQuestionsSectionProps {
  dataroomId?: string;
  linkId: string;
  documentId?: string;
  viewerId?: string;
  onAnswerQuestion: (question: ProposedQuestion) => void;
  onViewConversation: (conversationId: string) => void;
}

export function ProposedQuestionsSection({
  dataroomId,
  linkId,
  documentId,
  viewerId,
  onAnswerQuestion,
  onViewConversation,
}: ProposedQuestionsSectionProps) {
  const params = new URLSearchParams();
  if (dataroomId) params.set("dataroomId", dataroomId);
  if (linkId) params.set("linkId", linkId);
  if (documentId) params.set("documentId", documentId);
  if (viewerId) params.set("viewerId", viewerId);

  const { data: questions = [] } = useSWR<ProposedQuestion[]>(
    dataroomId ? `/api/proposed-questions?${params.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      keepPreviousData: true,
    },
  );

  if (questions.length === 0) return null;

  return (
    <div className="flex-shrink-0">
      <div className="px-4 pb-2 pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Questions for You
        </h3>
      </div>
      <div className="space-y-1 px-2 pb-2">
        {questions.map((q) => (
          <button
            key={q.id}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/50"
            onClick={() => {
              if (q.hasResponded && q.conversationId) {
                onViewConversation(q.conversationId);
              } else {
                onAnswerQuestion(q);
              }
            }}
          >
            {q.hasResponded ? (
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/40" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{q.question}</p>
              {q.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {q.description}
                </p>
              )}
            </div>
            {q.hasResponded ? (
              <Badge
                variant="secondary"
                className="shrink-0 text-xs"
              >
                Answered
              </Badge>
            ) : (
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
      <Separator />
    </div>
  );
}
