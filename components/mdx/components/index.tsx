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
  h2: ({ children, ...props }) => (
    <h2
      data-mdx-heading
      className="text-2xl font-semibold text-black"
      id={props.id}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      data-mdx-heading
      className="text-xl font-semibold text-black"
      id={props.id}
    >
      {children}
    </h3>
  ),
  // any other components you want to use in your markdown
};
