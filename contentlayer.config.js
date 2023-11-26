import { defineDocumentType, makeSource } from "contentlayer/source-files";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
};
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/**/*.mdx`,
  contentType:"mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    image: { type: "string", required: false },
    authors: {
      type: "list",
      of: { type: "string" },
      required: true,
    },
    date: { type: "date", required: true },
  },
 computedFields,
}));
export const Author = defineDocumentType(() => ({
  name: "Author",
  filePathPattern: `authors/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    avatar: {
      type: "string",
      required: false,
    },
    twitter: {
      type: "string",
      required: true,
    },
  },
  computedFields,
}));

export const Changelog = defineDocumentType(() => ({
  name: "Changelog",
  filePathPattern: "changelog/**/*.mdx",
  contentType: "mdx",
  fields: {
      title: {
          type: "string",
          required: true,
      },
      date: {
          type: "string",
          required: true,
      },
      summary: {
          type: "string",
          required: true,
      },
      image: {
          type: "string",
          required: true,
      },
      authors: {
        type: "list",
        of: { type: "string" },
        required: true,
      },
      draft: {
          type: "boolean",
          default: false,
      },
  },
  // @ts-ignore
  computedFields,
}));

// export default makeSource({ contentDirPath: 'contents', documentTypes: [Post,Author] })

export default makeSource({
  contentDirPath: "./contents",
  documentTypes: [Post, Author , Changelog],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          onVisitLine(node) {
            // Prevent lines from collapsing in `display: grid` mode, and allow empty
            // lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className.push("line--highlighted");
          },
          onVisitHighlightedWord(node) {
            node.properties.className = ["word--highlighted"];
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ["subheading-anchor"],
            ariaLabel: "Link to section",
          },
        },
      ],
    ],
  },
});
