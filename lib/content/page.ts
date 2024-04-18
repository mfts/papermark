// import { cache } from "react";

type Page = {
  id: number;
  slug: string;
  metadescription: string | null;
  metatitle: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  button: string | null;
  subtitle1: string | null;
  subtitle2: string | null;
  description1: string | null;
  description2: string | null;
  image1: string | null;
  image2: string | null;
  cta: string | null;
};

// `cache` is a React 18 feature that allows you to cache a function for the lifetime of a request.
// this means getPosts() will only be called once per page build, even though we may call it multiple times
// when rendering the page.
export const getPages = async () => {
  if (!process.env.CONTENT_BASE_URL) {
    return [];
  }

  const response = await fetch(`${process.env.CONTENT_BASE_URL}/api/pages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INVESTORS_API_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = (await response.json()) as Page[];
  return data;
};

export const getPage = async (slug: string) => {
  const pages = await getPages();
  return pages.find((page) => page.slug === slug);
};
