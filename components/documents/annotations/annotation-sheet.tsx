"use client";

import { useState } from "react";

import { Edit2, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAnnotations } from "@/lib/swr/use-annotations";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AnnotationForm } from "./annotation-form";

interface AnnotationSheetProps {
  documentId: string;
  teamId: string;
  numPages?: number;
  trigger?: React.ReactNode;
}

export function AnnotationSheet({
  documentId,
  teamId,
  numPages = 1,
  trigger,
}: AnnotationSheetProps) {
  const { annotations, mutate } = useAnnotations(documentId, teamId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<any>(null);

  const handleDelete = async (annotationId: string) => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}/annotations/${annotationId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete annotation");
      }

      toast.success("Annotation deleted successfully");
      mutate();
    } catch (error) {
      console.error("Error deleting annotation:", error);
      toast.error("Failed to delete annotation");
    }
  };

  const handleToggleVisibility = async (
    annotationId: string,
    isVisible: boolean,
  ) => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}/annotations/${annotationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isVisible: !isVisible,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update annotation");
      }

      toast.success(
        `Annotation ${!isVisible ? "shown" : "hidden"} successfully`,
      );
      mutate();
    } catch (error) {
      console.error("Error updating annotation:", error);
      toast.error("Failed to update annotation");
    }
  };

  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingAnnotation(null);
    mutate();
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Add Annotations
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Document Annotations</SheetTitle>
          <SheetDescription>
            Manage annotations that viewers can see when viewing this document.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {annotations?.length || 0} annotation
              {annotations?.length !== 1 ? "s" : ""}
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Annotation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Annotation</DialogTitle>
                  <DialogDescription>
                    Add a new annotation that viewers can see when viewing this
                    document.
                  </DialogDescription>
                </DialogHeader>
                <AnnotationForm
                  documentId={documentId}
                  teamId={teamId}
                  numPages={numPages}
                  onSuccess={handleFormSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {annotations && annotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No annotations yet</h3>
                <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                  Create your first annotation to help viewers understand your
                  document better.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Annotation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {annotations?.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{annotation.title}</h4>
                          {!annotation.isVisible && (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Pages: {annotation.pages.join(", ")}</span>
                          <span>•</span>
                          <span>
                            Created by{" "}
                            {annotation.createdBy?.name ||
                              annotation.createdBy?.email}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(
                              annotation.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleVisibility(
                              annotation.id,
                              annotation.isVisible,
                            )
                          }
                        >
                          {annotation.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Dialog
                          open={editingAnnotation?.id === annotation.id}
                          onOpenChange={(open) =>
                            setEditingAnnotation(open ? annotation : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Annotation</DialogTitle>
                              <DialogDescription>
                                Update this annotation.
                              </DialogDescription>
                            </DialogHeader>
                            <AnnotationForm
                              documentId={documentId}
                              teamId={teamId}
                              numPages={numPages}
                              annotation={annotation}
                              onSuccess={handleFormSuccess}
                            />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Annotation
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this annotation?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(annotation.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Preview of annotation content */}
                    {annotation.content && (
                      <div className="rounded bg-muted/50 p-3 text-sm text-muted-foreground">
                        <div className="line-clamp-3">
                          {/* Simple text preview */}
                          {typeof annotation.content === "object" &&
                          annotation.content.content
                            ? annotation.content.content
                                .filter(
                                  (node: any) => node.type === "paragraph",
                                )
                                .map((node: any) =>
                                  node.content
                                    ?.filter(
                                      (textNode: any) =>
                                        textNode.type === "text",
                                    )
                                    .map((textNode: any) => textNode.text)
                                    .join(" "),
                                )
                                .join(" ")
                            : "No content"}
                        </div>
                        {annotation.images && annotation.images.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {annotation.images.slice(0, 3).map((image) => (
                              <img
                                key={image.id}
                                src={image.url}
                                alt={image.filename}
                                className="h-8 w-8 rounded border object-cover"
                              />
                            ))}
                            {annotation.images.length > 3 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded border bg-muted text-xs">
                                +{annotation.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
