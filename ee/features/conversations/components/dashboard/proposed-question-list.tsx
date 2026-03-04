"use client";

import { useState } from "react";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EditIcon,
  Loader2,
  MessageSquareIcon,
  MoreVertical,
  Plus,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate as swrMutate } from "swr";

import { fetcher, timeAgo } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ProposedQuestionForm,
  ProposedQuestionFormData,
} from "./proposed-question-form";

export interface ProposedQuestion {
  id: string;
  question: string;
  description: string | null;
  orderIndex: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  link: { id: string; name: string | null } | null;
  dataroomDocument: {
    document: { name: string };
  } | null;
  createdByUser: { name: string | null; email: string | null };
  _count: { conversations: number };
}

interface ProposedQuestionListProps {
  teamId: string;
  dataroomId: string;
}

export function ProposedQuestionList({
  teamId,
  dataroomId,
}: ProposedQuestionListProps) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<ProposedQuestion | null>(null);
  const [deleteQuestion, setDeleteQuestion] =
    useState<ProposedQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const apiUrl = `/api/teams/${teamId}/datarooms/${dataroomId}/proposed-questions`;

  const {
    data: questions = [],
    isLoading,
    mutate,
  } = useSWR<ProposedQuestion[]>(teamId && dataroomId ? apiUrl : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
    keepPreviousData: true,
  });

  const handleAdd = async (data: ProposedQuestionFormData) => {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      toast.error(err.error || "Failed to add question");
      throw new Error(err.error);
    }

    toast.success("Question added");
    mutate();
  };

  const handleEdit = async (data: ProposedQuestionFormData) => {
    if (!editingQuestion) return;

    const response = await fetch(`${apiUrl}/${editingQuestion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      toast.error(err.error || "Failed to update question");
      throw new Error(err.error);
    }

    toast.success("Question updated");
    setEditingQuestion(null);
    mutate();
  };

  const handleToggleStatus = async (q: ProposedQuestion) => {
    const newStatus = q.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

    const response = await fetch(`${apiUrl}/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(
      newStatus === "ARCHIVED" ? "Question archived" : "Question restored",
    );
    mutate();
  };

  const handleDelete = async () => {
    if (!deleteQuestion) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiUrl}/${deleteQuestion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to delete question");
        return;
      }

      toast.success("Question deleted");
      mutate();
    } finally {
      setIsDeleting(false);
      setDeleteQuestion(null);
    }
  };

  const activeQuestions = questions.filter((q) => q.status === "ACTIVE");
  const archivedQuestions = questions.filter((q) => q.status === "ARCHIVED");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Questions proposed by your team that visitors will be asked to answer.
        </p>
        <Button onClick={() => setIsAddFormOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed">
          <MessageSquareIcon className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No proposed questions yet
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsAddFormOpen(true)}
          >
            Add your first question
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Question</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...activeQuestions, ...archivedQuestions].map((q) => (
                <TableRow
                  key={q.id}
                  className={q.status === "ARCHIVED" ? "opacity-60" : ""}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{q.question}</span>
                      {q.description && (
                        <span className="text-xs text-muted-foreground">
                          {q.description}
                        </span>
                      )}
                      {q.dataroomDocument && (
                        <span className="text-xs text-muted-foreground">
                          Doc: {q.dataroomDocument.document.name}
                        </span>
                      )}
                      {q.link && (
                        <span className="text-xs text-muted-foreground">
                          Link: {q.link.name || q.link.id}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {q._count.conversations}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        q.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {q.status === "ACTIVE" ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {timeAgo(new Date(q.createdAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingQuestion(q)}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(q)}
                        >
                          {q.status === "ACTIVE" ? (
                            <>
                              <ArchiveIcon className="mr-2 h-4 w-4" />
                              Archive
                            </>
                          ) : (
                            <>
                              <ArchiveRestoreIcon className="mr-2 h-4 w-4" />
                              Restore
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteQuestion(q)}
                        >
                          <Trash2Icon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProposedQuestionForm
        open={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        onSubmit={handleAdd}
        title="Add Proposed Question"
      />

      {editingQuestion && (
        <ProposedQuestionForm
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingQuestion(null);
          }}
          onSubmit={handleEdit}
          initialData={{
            question: editingQuestion.question,
            description: editingQuestion.description ?? undefined,
          }}
          title="Edit Proposed Question"
        />
      )}

      <Dialog
        open={!!deleteQuestion}
        onOpenChange={(open) => {
          if (!open) setDeleteQuestion(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proposed Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? Existing response
              conversations will be kept but no longer linked to this question.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteQuestion(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
