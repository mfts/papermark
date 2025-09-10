import { format } from "date-fns";
import { Check, HelpCircle, MessageSquareReply } from "lucide-react";

export function ConversationMessage({
  message,
  isAuthor,
  senderEmail,
  isSelectable = false,
  isSelected = false,
  selectionType,
  isPublished = false,
  onSelect,
}: {
  message: any;
  isAuthor: boolean;
  senderEmail: string;
  isSelectable?: boolean;
  isSelected?: boolean;
  selectionType?: "question" | "answer";
  isPublished?: boolean;
  onSelect?: (messageId: string, isVisitor: boolean) => void;
}) {
  const isVisitor = message.viewerId != null;
  const canBeSelected =
    isSelectable &&
    ((isVisitor && !isAuthor) || // Visitor questions
      (!isVisitor && isAuthor)); // Admin answers

  return (
    <div className="group relative">
      <div
        className={`flex w-max max-w-[80%] cursor-pointer flex-col rounded-lg px-4 py-2 transition-all ${
          isAuthor ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
        } ${
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2"
            : canBeSelected
              ? "hover:ring-1 hover:ring-gray-300"
              : ""
        }`}
        onClick={() => canBeSelected && onSelect?.(message.id, isVisitor)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-sm">{message.content}</p>
          <div className="mt-0.5 flex items-center gap-1">
            {isPublished && (
              <div className="flex items-center text-xs opacity-60">
                <Check className="mr-1 h-3 w-3" />
                FAQ
              </div>
            )}
            {canBeSelected && (
              <div
                className={`flex items-center text-xs opacity-60 ${
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-60"
                }`}
              >
                {isVisitor ? (
                  <>
                    <HelpCircle className="mr-1 h-3 w-3" />
                    {isSelected ? "Question" : "Q"}
                  </>
                ) : (
                  <>
                    <MessageSquareReply className="mr-1 h-3 w-3" />
                    {isSelected ? "Answer" : "A"}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 text-xs opacity-70">
          {isAuthor ? "You" : message.userId ? "Admin" : senderEmail} •{" "}
          {format(new Date(message.createdAt), "MMM d, h:mm a")}
        </div>
      </div>
    </div>
  );
}
