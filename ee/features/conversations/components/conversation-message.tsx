import { format } from "date-fns";

export function ConversationMessage({
  message,
  isAuthor,
  senderEmail,
}: {
  message: any;
  isAuthor: boolean;
  senderEmail: string;
}) {
  return (
    <div
      className={`flex w-max max-w-[80%] flex-col rounded-lg px-4 py-2 ${
        isAuthor ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
      }`}
    >
      <p className="text-sm">{message.content}</p>
      <div className="mt-1 text-xs opacity-70">
        {isAuthor ? "You" : message.userId ? "Admin" : senderEmail} •{" "}
        {format(new Date(message.createdAt), "MMM d, h:mm a")}
      </div>
    </div>
  );
}
