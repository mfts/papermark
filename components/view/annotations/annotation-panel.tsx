"use client";

import { useMemo, useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import { ChevronDown, ChevronRight } from "lucide-react";

import { useViewerAnnotations } from "@/lib/swr/use-annotations";
import { determineTextColor } from "@/lib/utils/determine-text-color";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnnotationPanelProps {
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  linkId: string;
  documentId?: string;
  viewId?: string;
  currentPage: number;
  isVisible: boolean;
  onResize?: (size: number) => void;
}

export function AnnotationPanel({
  brand,
  linkId,
  documentId,
  viewId,
  currentPage,
  isVisible,
  onResize,
}: AnnotationPanelProps) {
  const { annotations, loading } = useViewerAnnotations(
    linkId,
    documentId,
    viewId,
  );
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(
    new Set(),
  );

  // Filter annotations for current page
  const currentPageAnnotations = useMemo(() => {
    if (!annotations) return [];
    return annotations.filter((annotation) =>
      annotation.pages.includes(currentPage),
    );
  }, [annotations, currentPage]);

  const toggleAnnotation = (annotationId: string) => {
    const newExpanded = new Set(expandedAnnotations);
    if (newExpanded.has(annotationId)) {
      newExpanded.delete(annotationId);
    } else {
      newExpanded.add(annotationId);
    }
    setExpandedAnnotations(newExpanded);
  };

  const renderContent = (content: any) => {
    if (!content) return null;

    // Properly render Tiptap JSON content
    if (typeof content === "object" && content.content) {
      return (
        <div className="prose prose-sm max-w-none text-gray-700">
          {content.content.map((node: any, index: number) => {
            if (node.type === "paragraph") {
              return (
                <p
                  key={index}
                  className="mb-2 text-sm leading-relaxed text-gray-700"
                >
                  {node.content?.map((textNode: any, textIndex: number) => {
                    if (textNode.type === "text") {
                      let text = textNode.text;
                      // Apply formatting if marks exist
                      if (textNode.marks) {
                        textNode.marks.forEach((mark: any) => {
                          if (mark.type === "bold") {
                            text = (
                              <strong key={textIndex} className="font-semibold">
                                {text}
                              </strong>
                            );
                          } else if (mark.type === "italic") {
                            text = (
                              <em key={textIndex} className="italic">
                                {text}
                              </em>
                            );
                          }
                        });
                      }
                      return text;
                    } else if (textNode.type === "image") {
                      return (
                        <img
                          key={textIndex}
                          src={textNode.attrs?.src}
                          alt={textNode.attrs?.alt || ""}
                          className="my-2 h-auto max-w-full rounded-md"
                        />
                      );
                    }
                    return null;
                  })}
                </p>
              );
            } else if (node.type === "bulletList") {
              return (
                <ul
                  key={index}
                  className="mb-2 list-inside list-disc text-sm text-gray-700"
                >
                  {node.content?.map((listItem: any, listIndex: number) => (
                    <li key={listIndex} className="mb-1">
                      {listItem.content?.[0]?.content?.[0]?.text}
                    </li>
                  ))}
                </ul>
              );
            } else if (node.type === "orderedList") {
              return (
                <ol
                  key={index}
                  className="mb-2 list-inside list-decimal text-sm text-gray-700"
                >
                  {node.content?.map((listItem: any, listIndex: number) => (
                    <li key={listIndex} className="mb-1">
                      {listItem.content?.[0]?.content?.[0]?.text}
                    </li>
                  ))}
                </ol>
              );
            } else if (node.type === "blockquote") {
              return (
                <blockquote
                  key={index}
                  className="mb-2 border-l-2 border-gray-300 pl-3 text-sm italic text-gray-600"
                >
                  {node.content?.[0]?.content?.[0]?.text}
                </blockquote>
              );
            } else if (node.type === "image") {
              return (
                <img
                  key={index}
                  src={node.attrs?.src}
                  alt={node.attrs?.alt || ""}
                  className="my-2 h-auto max-w-full rounded-md"
                />
              );
            }
            return null;
          })}
        </div>
      );
    }

    return <p className="text-sm text-gray-500">No content</p>;
  };

  if (!isVisible) return null;

  return (
    <div className="h-full w-full bg-transparent">
      <ScrollArea className="h-full">
        <div className="space-y-3 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div
                className="text-xs opacity-70"
                style={{ color: determineTextColor(brand?.accentColor) }}
              >
                Loading annotations...
              </div>
            </div>
          ) : currentPageAnnotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p
                className="mb-1 text-xs opacity-70"
                style={{ color: determineTextColor(brand?.accentColor) }}
              >
                No annotations on this page
              </p>
            </div>
          ) : (
            currentPageAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="rounded-lg border border-gray-300/50 bg-white/95 shadow-sm backdrop-blur-sm transition-all hover:border-gray-400/60 hover:bg-white"
              >
                <Collapsible
                  open={expandedAnnotations.has(annotation.id)}
                  onOpenChange={() => toggleAnnotation(annotation.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="w-full cursor-pointer">
                      <div className="flex w-full items-center justify-between p-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium text-gray-800">
                            {annotation.title}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            Page{annotation.pages.length > 1 ? "s" : ""}{" "}
                            {annotation.pages.join(", ")}
                          </p>
                        </div>
                        <button
                          className="ml-2 shrink-0 rounded-md p-1 transition-colors hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAnnotation(annotation.id);
                          }}
                        >
                          {expandedAnnotations.has(annotation.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-gray-200 px-3 pb-3 pt-3">
                      <div className="text-sm text-gray-700">
                        {renderContent(annotation.content)}
                      </div>

                      {annotation.images && annotation.images.length > 0 && (
                        <div
                          className="mt-3 grid gap-2"
                          style={{
                            gridTemplateColumns:
                              annotation.images.length === 1
                                ? "1fr"
                                : annotation.images.length === 2
                                  ? "repeat(2, 1fr)"
                                  : "repeat(auto-fit, minmax(120px, 1fr))",
                          }}
                        >
                          {annotation.images.map((image) => (
                            <div
                              key={image.id}
                              className="overflow-hidden rounded-md border border-gray-200"
                            >
                              <img
                                src={image.url}
                                alt={image.filename}
                                className="h-auto max-h-32 w-full object-contain"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
