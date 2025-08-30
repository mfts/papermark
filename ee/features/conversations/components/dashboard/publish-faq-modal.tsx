import React, { useState } from "react";

import {
  faqParamSchema,
  publishFAQFormSchema,
} from "@/ee/features/conversations/lib/schemas/faq";
import { BookOpen, Check, FileText, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string | null;
  viewerId: string | null;
}

interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  dataroomDocument?: {
    id?: string;
    document: {
      name: string;
    };
  };
  linkId?: string;
  link?: {
    id: string;
    name: string;
  };
}

interface PublishFAQModalProps {
  conversation: Conversation;
  dataroomId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedQuestionMessage?: Message;
  selectedAnswerMessage?: Message;
}

interface PublishFAQFormData {
  editedQuestion: string;
  answer: string;
  visibilityMode: "PUBLIC_DATAROOM" | "PUBLIC_LINK" | "PUBLIC_DOCUMENT";
  questionMessageId: string;
  answerMessageId: string;
}

const visibilityOptions = [
  {
    value: "PUBLIC_DATAROOM" as const,
    label: "Entire Dataroom",
    description: "Visible to all dataroom visitors",
    icon: BookOpen,
  },
  {
    value: "PUBLIC_LINK" as const,
    label: "Specific Link",
    description: "Visible only to visitors from this link",
    icon: Link2,
  },
  {
    value: "PUBLIC_DOCUMENT" as const,
    label: "Specific Document",
    description: "Visible only when viewing this document",
    icon: FileText,
  },
];

export function PublishFAQModal({
  conversation,
  dataroomId,
  teamId,
  isOpen,
  onClose,
  onSuccess,
  selectedQuestionMessage,
  selectedAnswerMessage,
}: PublishFAQModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState<PublishFAQFormData>({
    editedQuestion: selectedQuestionMessage?.content || "",
    answer: selectedAnswerMessage?.content || "",
    visibilityMode: "PUBLIC_DATAROOM",
    questionMessageId: selectedQuestionMessage?.id || "",
    answerMessageId: selectedAnswerMessage?.id || "",
  });

  // Update form data when selected messages change
  React.useEffect(() => {
    if (selectedQuestionMessage && selectedAnswerMessage) {
      setFormData((prev) => ({
        ...prev,
        editedQuestion: selectedQuestionMessage.content,
        answer: selectedAnswerMessage.content,
        questionMessageId: selectedQuestionMessage.id,
        answerMessageId: selectedAnswerMessage.id,
      }));
    }
  }, [selectedQuestionMessage, selectedAnswerMessage]);

  const handleInputChange = (
    field: keyof PublishFAQFormData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!selectedQuestionMessage || !selectedAnswerMessage) {
      toast.error("Please select both a question and an answer");
      return;
    }

    try {
      // Validate API parameters
      const paramValidation = faqParamSchema.safeParse({
        teamId,
        id: dataroomId,
      });

      if (!paramValidation.success) {
        toast.error("Invalid team or dataroom ID");
        return;
      }

      // Validate form data
      const formValidation = publishFAQFormSchema.safeParse({
        ...formData,
        questionMessageId: selectedQuestionMessage.id,
        answerMessageId: selectedAnswerMessage.id,
      });

      if (!formValidation.success) {
        const firstError = formValidation.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const validatedData = formValidation.data;
      setIsPublishing(true);

      const payload = {
        editedQuestion: validatedData.editedQuestion,
        answer: validatedData.answer,
        visibilityMode: validatedData.visibilityMode,
        sourceConversationId: conversation.id,
        linkId: conversation.linkId,
        dataroomDocumentId: conversation.dataroomDocument?.id || null,
        ...(conversation.dataroomDocument?.id
          ? { dataroomDocumentId: conversation.dataroomDocument.id }
          : {}),
        isAnonymized: true, // Always anonymize published FAQs
        questionMessageId: validatedData.questionMessageId,
        answerMessageId: validatedData.answerMessageId,
      };

      const response = await fetch(
        `/api/teams/${paramValidation.data.teamId}/datarooms/${paramValidation.data.id}/faqs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.details || "Failed to publish FAQ",
        );
      }

      toast.success("FAQ published successfully!");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        editedQuestion: selectedQuestionMessage?.content || "",
        answer: selectedAnswerMessage?.content || "",
        visibilityMode: "PUBLIC_DATAROOM",
        questionMessageId: selectedQuestionMessage?.id || "",
        answerMessageId: selectedAnswerMessage?.id || "",
      });
    } catch (error) {
      console.error("Error publishing FAQ:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish FAQ",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl md:w-full">
        <DialogHeader>
          <DialogTitle>Publish FAQ from Conversation</DialogTitle>
          <DialogDescription>
            Review and edit the selected question and answer before publishing
            as a FAQ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePublish} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Selected Messages Preview */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Selected Question
                </label>
                <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <div className="flex items-start justify-between">
                    <p className="flex-1 text-sm">
                      {selectedQuestionMessage?.content}
                    </p>
                    <Check className="ml-2 h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Visitor •{" "}
                    {selectedQuestionMessage &&
                      new Date(
                        selectedQuestionMessage.createdAt,
                      ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Selected Answer
                </label>
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50/50 p-3">
                  <div className="flex items-start justify-between">
                    <p className="flex-1 text-sm">
                      {selectedAnswerMessage?.content}
                    </p>
                    <Check className="ml-2 h-4 w-4 text-green-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Admin •{" "}
                    {selectedAnswerMessage &&
                      new Date(
                        selectedAnswerMessage.createdAt,
                      ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editedQuestion">Question *</Label>
                <Textarea
                  id="editedQuestion"
                  placeholder="Edit the question for clarity..."
                  className="min-h-[80px]"
                  value={formData.editedQuestion}
                  onChange={(e) =>
                    handleInputChange("editedQuestion", e.target.value)
                  }
                />
                <p className="text-sm text-gray-500">
                  You can edit the question to make it clearer for other
                  visitors.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  placeholder="Edit the answer if needed..."
                  className="min-h-[80px]"
                  value={formData.answer}
                  onChange={(e) => handleInputChange("answer", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibilityMode">Visibility</Label>
                <Select
                  value={formData.visibilityMode}
                  onValueChange={(value) =>
                    handleInputChange(
                      "visibilityMode",
                      value as PublishFAQFormData["visibilityMode"],
                    )
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select visibility scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={
                          option.value === "PUBLIC_DOCUMENT" &&
                          !conversation.dataroomDocument
                        }
                      >
                        <div className="flex items-center space-x-4">
                          <option.icon className="h-4 w-4" />
                          <div className="flex flex-col items-start">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={
                isPublishing ||
                !selectedQuestionMessage ||
                !selectedAnswerMessage
              }
            >
              {isPublishing ? "Publishing..." : "Publish FAQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
