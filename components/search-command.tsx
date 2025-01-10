"use client";

import { useEffect, useState } from "react";

import { DialogProps } from "@radix-ui/react-dialog";
import { FileText } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Article {
  data: {
    title: string;
    slug: string;
    description?: string;
  };
}

interface SearchCommandProps extends DialogProps {
  articles: Article[];
  locale: string;
  placeholder: string;
  noResultsText: string;
  articlesHeading: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchCommand({
  articles,
  locale,
  placeholder,
  noResultsText,
  articlesHeading,
  open,
  onOpenChange,
  ...props
}: SearchCommandProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent className="max-w-[550px] gap-0 overflow-hidden border-none p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput
            placeholder={placeholder}
            className="h-14 border-none px-4 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm">
              {noResultsText}
            </CommandEmpty>
            <CommandGroup heading={articlesHeading} className="px-4">
              {articles.map((article) => (
                <CommandItem
                  key={article.data.slug}
                  value={article.data.title}
                  onSelect={() => {
                    const path = `/help/article/${article.data.slug}`;
                    window.open(
                      `${process.env.NEXT_PUBLIC_MARKETING_URL}${path}`,
                      "_blank",
                    );
                    onOpenChange?.(false);
                  }}
                  className="cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FileText className="mr-2 h-4 w-4 text-[#fb7a00]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {article.data.title}
                    </span>
                    {article.data.description && (
                      <span className="text-xs text-muted-foreground">
                        {article.data.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
