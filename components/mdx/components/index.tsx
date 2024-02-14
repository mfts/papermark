import Link from "next/link";
import { MDXImage } from "./mdx-image";
import { MDXComponents } from "mdx/types";
import { Code } from "bright";
import NextImage from "next/image";

export const mdxComponents: MDXComponents = {
  a: ({ children, ...props }) => {
    // check if external links
    let isExternal = false;
    if (props.href?.startsWith("http")) {
      isExternal = true;
    }

    return (
      // @ts-expect-error legacy refs
      <Link
        {...props}
        href={props.href || ""}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  },
  img: MDXImage as any,
  Image: NextImage as any,
  pre: Code,
  // any other components you want to use in your markdown
};
