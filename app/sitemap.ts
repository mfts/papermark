import { getPosts } from "@/lib/content/blog";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts()
  const blogs = posts.map((post) => ({
    url: `https://www.papermark.io/blog/${post?.data.slug}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))
  
  return [
    {
      url: "https://www.papermark.io",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/alternatives/docsend",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/alternatives/brieflink",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/alternatives/pandadoc",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/alternatives/google-drive",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/alternatives/pitch",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/privacy",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/open-source-investors",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/docsend-alternatives",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/oss-friends",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://vc.papermark.io",
      lastModified: new Date().toISOString().split('T')[0],
    },
    {
      url: "https://www.papermark.io/investors",
      lastModified: new Date().toISOString().split('T')[0],
    },
    ...blogs
  ];
}
