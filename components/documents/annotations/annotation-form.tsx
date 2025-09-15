"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { uploadImage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-hook";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  content: z.any().optional(),
  pages: z.array(z.number()).min(1, "At least one page must be selected"),
  isVisible: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AnnotationFormProps {
  documentId: string;
  teamId: string;
  numPages: number;
  annotation?: any;
  onSuccess: () => void;
}

export function AnnotationForm({
  documentId,
  teamId,
  numPages,
  annotation,
  onSuccess,
}: AnnotationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editorContent, setEditorContent] = useState(
    annotation?.content || { type: "doc", content: [] },
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: annotation?.title || "",
      content: annotation?.content || null,
      pages: annotation?.pages || [],
      isVisible:
        annotation?.isVisible !== undefined ? annotation.isVisible : true,
    },
  });

  const pageOptions = Array.from({ length: numPages }, (_, i) => i + 1);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Upload the image using the existing uploadImage utility
      const imageUrl = await uploadImage(file, "assets");

      // Don't save to database here - let the form submission handle it
      // Images will be embedded in the rich text content and parsed when saving

      return imageUrl;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw new Error("Failed to upload image");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const url = annotation
        ? `/api/teams/${teamId}/documents/${documentId}/annotations/${annotation.id}`
        : `/api/teams/${teamId}/documents/${documentId}/annotations`;

      const method = annotation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          content: editorContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save annotation");
      }

      toast.success(
        annotation
          ? "Annotation updated successfully"
          : "Annotation created successfully",
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving annotation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save annotation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter annotation title" {...field} />
              </FormControl>
              <FormDescription>
                A brief title for this annotation that viewers will see.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pages</FormLabel>
              <FormDescription>
                Select which pages this annotation should appear on.
              </FormDescription>
              <div className="mt-2 grid grid-cols-10 gap-2">
                {pageOptions.map((page) => (
                  <div key={page} className="flex items-center space-x-2">
                    <Checkbox
                      id={`page-${page}`}
                      checked={field.value.includes(page)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, page]);
                        } else {
                          field.onChange(field.value.filter((p) => p !== page));
                        }
                      }}
                    />
                    <label
                      htmlFor={`page-${page}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {page}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Content</FormLabel>
          <FormDescription>
            Add rich text content and images to help explain this part of the
            document.
          </FormDescription>
          <RichTextEditor
            content={editorContent}
            onChange={setEditorContent}
            placeholder="Add your annotation content here..."
            onImageUpload={handleImageUpload}
          />
        </div>

        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visible to viewers</FormLabel>
                <FormDescription>
                  When enabled, viewers will be able to see this annotation when
                  viewing the document.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {annotation ? "Update Annotation" : "Create Annotation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
