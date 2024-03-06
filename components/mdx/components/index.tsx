import Link from "next/link";
import { MDXImage } from "./mdx-image";
import { MDXComponents } from "mdx/types";
import { Code } from "bright";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const mdxComponents: MDXComponents = {
  a: ({ children, ...props }) => {
    // check if external links
    let isExternal = false;
    // if the link is not from papermark.io, it's external
    if (
      props.href?.startsWith("http") ||
      !props.href?.includes("papermark.io")
    ) {
      isExternal = true;
    }

    return (
      // @ts-expect-error legacy refs
      <Link
        {...props}
        className={cn(
          props.className,
          "text-[#fb7a00] font-semibold no-underline hover:underline",
        )}
        href={props.href || ""}
        target="_blank"
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  },
  img: MDXImage as any,
  Image: NextImage as any,
  pre: Code,
  Button: ({ children, ...props }) => {
    // check if external links
    let isExternal = false;
    // if the link is not from papermark.io, it's external
    if (
      props.href?.startsWith("http") ||
      !props.href?.includes("papermark.io")
    ) {
      isExternal = true;
    }

    return (
      <Link
        href={props.href || ""}
        target="_blank"
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="no-underline"
      >
        <Button
          variant={props.variant || "default"}
          className={props.className}
        >
          {children}
        </Button>
      </Link>
    );
  },
  // any other components you want to use in your markdown
};
