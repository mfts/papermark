import {
  getPosts,
  getAlternatives,
  getPages,
  getHelpArticles,
} from "@/lib/content";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  const solutions = await getPages();
  const alternatives = await getAlternatives();
  const helpArticles = await getHelpArticles();
  const blogLinks = posts.map((post) => ({
    url: `https://www.papermark.io/blog/${post?.data.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));
  const solutionLinks = solutions.map((solution) => ({
    url: `https://www.papermark.io/solutions/${solution?.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));
  const alternativeLinks = alternatives.map((alternative) => ({
    url: `https://www.papermark.io/alternatives/${alternative?.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));
  const helpArticleLinks = helpArticles.map((article) => ({
    url: `https://www.papermark.io/help/article/${article?.data.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [
    {
      url: "https://www.papermark.io",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://www.papermark.io/privacy",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://www.papermark.io/open-source-investors",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://www.papermark.io/docsend-alternatives",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://www.papermark.io/oss-friends",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://vc.papermark.io",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://www.papermark.io/investors",
      lastModified: new Date().toISOString().split("T")[0],
    },
    {
      url: "https://www.papermark.io/blog",
      lastModified: new Date().toISOString().split("T")[0],
    },
    ...blogLinks,
    ...solutionLinks,
    ...alternativeLinks,
    ...helpArticleLinks,
  ];
}
