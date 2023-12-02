import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.papermark.io",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/alternatives/docsend",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/alternatives/brieflink",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/alternatives/pandadoc",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/alternatives/google-drive",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/alternatives/pitch",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/privacy",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/open-source-investors",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/docsend-alternatives",
      lastModified: new Date(),
    },
    {
      url: "https://www.papermark.io/oss-friends",
      lastModified: new Date(),
    },
    {
      url: "https://vc.papermark.io",
      lastModified: new Date(),
    },
  ];
}
