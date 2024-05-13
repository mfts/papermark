import { cache } from "react";

type Investor = {
  id: number;
  name: string;
  imageUrl: string | null;
  round: string | null;
  location: string | null;
  sector: string | null;
  website: string | null;
  status: string | null;
  slug: string | null;
};

// `cache` is a React 18 feature that allows you to cache a function for the lifetime of a request.
// this means getPosts() will only be called once per page build, even though we may call it multiple times
// when rendering the page.
export const getInvestors = cache(async () => {
  if (!process.env.CONTENT_BASE_URL) {
    return [];
  }

  const response = await fetch(
    `${process.env.CONTENT_BASE_URL}/api/investors`,
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
  const data = (await response.json()) as Investor[];
  return data;
});

export const getInvestor = async (slug: string) => {
  const investors = await getInvestors();
  return investors.find((investor) => investor.slug === slug);
};
