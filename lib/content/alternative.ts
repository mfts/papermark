// import { cache } from "react";

type Alternative = {
  id: number;
  slug: string;
  metadescription: string | null;
  metatitle: string | null;
  title: string | null;
  description: string | null;
  subtitlecompare: string | null;
  descriptioncompare: string | null;
  subtitlefeatures: string | null;
  descriptionfeatures: string | null;
  descriptionfaq: string | null;
  subtitlecta: string | null;
  imageUrl: string | null;
  name: string | null;
  price: string | null;
  feature1: string | null;
  feature2: string | null;
  feature3: string | null;
  feature4: string | null;
  feature5: string | null;
  feature6: string | null;
};

// `cache` is a React 18 feature that allows you to cache a function for the lifetime of a request.
// this means getPosts() will only be called once per page build, even though we may call it multiple times
// when rendering the page.
export const getAlternatives = async () => {
  if (!process.env.CONTENT_BASE_URL) {
    return [];
  }

  const response = await fetch(
    `${process.env.CONTENT_BASE_URL}/api/alternatives`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INVESTORS_API_KEY}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = (await response.json()) as Alternative[];
  return data;
};

export const getAlternative = async (slug: string) => {
  const alternatives = await getAlternatives();
  return alternatives.find((alternative) => alternative.slug === slug);
};
