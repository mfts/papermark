import React, { useEffect, useState } from "react";

import {
  editFAQFormSchema,
  faqParamSchema,
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

import { PublishedFAQ } from "../../pages/faq-overview";

interface EditFAQModalProps {
  faq: PublishedFAQ;
  dataroomId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditFAQFormData {
  editedQuestion: string;
  answer: string;
  visibilityMode: "PUBLIC_DATAROOM" | "PUBLIC_LINK" | "PUBLIC_DOCUMENT";
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

export function EditFAQModal({
  faq,
  dataroomId,
  teamId,
  isOpen,
  onClose,
  onSuccess,
}: EditFAQModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<EditFAQFormData>({
    editedQuestion: faq.editedQuestion,
    answer: faq.answer,
    visibilityMode: faq.visibilityMode,
  });

  // Update form data when FAQ changes
  useEffect(() => {
    if (faq) {
      setFormData({
        editedQuestion: faq.editedQuestion,
        answer: faq.answer,
        visibilityMode: faq.visibilityMode,
      });
    }
  }, [faq]);

  const handleInputChange = (field: keyof EditFAQFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate API parameters
      const paramValidation = faqParamSchema.safeParse({
        teamId,
        id: dataroomId,
        faqId: faq.id,
      });

      if (!paramValidation.success) {
        toast.error("Invalid team, dataroom, or FAQ ID");
        return;
      }

      // Validate form data
      const formValidation = editFAQFormSchema.safeParse(formData);

      if (!formValidation.success) {
        const firstError = formValidation.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      setIsUpdating(true);
      const validatedData = formValidation.data;

      const response = await fetch(
        `/api/teams/${paramValidation.data.teamId}/datarooms/${paramValidation.data.id}/faqs/${paramValidation.data.faqId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validatedData),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || "Failed to update FAQ");
      }

      toast.success("FAQ updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update FAQ",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl md:w-full">
        <DialogHeader>
          <DialogTitle>Edit FAQ</DialogTitle>
          <DialogDescription>
            Update the question and answer content. You can see the original
            messages below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Original Messages Preview */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Original Question
                </label>
                <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <div className="flex items-start justify-between">
                    <p className="flex-1 text-sm">
                      {faq.questionMessage?.content ||
                        faq.originalQuestion ||
                        "No original question available"}
                    </p>
                    <Check className="ml-2 h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Original visitor message
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Original Answer
                </label>
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50/50 p-3">
                  <div className="flex items-start justify-between">
                    <p className="flex-1 text-sm">
                      {faq.answerMessage?.content ||
                        "No original answer available"}
                    </p>
                    <Check className="ml-2 h-4 w-4 text-green-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Original admin response
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
                  You can edit the question to make it clearer for visitors.
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
                      value as EditFAQFormData["visibilityMode"],
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
                          !faq.dataroomDocument
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
            <Button type="submit" variant="default" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update FAQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
