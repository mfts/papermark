import { cache } from "react";

import matter from "gray-matter";

import { getHeadings } from "./utils";

type Article = {
  data: {
    title: string;
    summary: string;
    publishedAt: string;
    author: string;
    image: string;
    slug: string;
    published: boolean;
    categories?: string[];
  };
  body: string;
  toc: { text: string; level: number }[];
};

const GITHUB_CONTENT_TOKEN = process.env.GITHUB_CONTENT_TOKEN;
const GITHUB_CONTENT_REPO = process.env.GITHUB_CONTENT_REPO;

export const getHelpArticles = cache(async () => {
  if (!GITHUB_CONTENT_REPO || !GITHUB_CONTENT_TOKEN) {
    return [];
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_CONTENT_REPO}/contents/content/help`;
  const headers = {
    Authorization: `Bearer ${GITHUB_CONTENT_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const response = await fetch(apiUrl, { headers });
  const data = await response.json();

  const articles = await Promise.all(
    data
      .filter((file: any) => file.name.endsWith(".mdx"))
      .map(async (file: any) => {
        const contentResponse = await fetch(file.url, { headers });
        const fileDetails = await contentResponse.json();
        const content = fileDetails.content; // Getting the base64 encoded content
        const decodedContent = Buffer.from(content, "base64").toString("utf8"); // Decoding the base64 content
        const { data, content: fileContent } = matter(decodedContent);

        if (data.published === false) {
          return null;
        }

        const headingItems = await getHeadings(fileContent);

        return { data, body: fileContent, toc: headingItems } as Article;
      }),
  );

  const filteredArticles = articles.filter(
    (article: Article) => article !== null,
  ) as Article[];
  return filteredArticles;
});

export async function getHelpArticle(slug: string) {
  const articles = await getHelpArticles();
  return articles.find((article) => article?.data.slug === slug);
}
