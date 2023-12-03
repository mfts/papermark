import { Metadata } from "next";
import Dashboard from "./ClientPage";
import { cache } from "react";

export const revalidate = 3600; // revalidate the data at most every 24 hours

const data = {
  description:
    "List of 100 open-source investors. Open-source VC, open-source angel investors. Share pitchdecks with your investors using Papermark, an open-source document infrastructure.",
  title: "Open Source Investors | Papermark",
  url: "https://www.papermark.io",
};

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Papermark",
    images: [
      {
        url: "https://www.papermark.io/_static/meta-image.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    creator: "@papermarkio",
    images: ["https://www.papermark.io/_static/meta-image.png"],
  },
};

const getInvestors = async () => {
  const response = await fetch(
    "https://api.airtable.com/v0/appAxYMTCbZ1hGTmg/tblvBs5aqTt8qkb6h?fields%5B%5D=name&fields%5B%5D=title&fields%5B%5D=company&fields%5B%5D=checkSize&fields%5B%5D=openSourceInvestments&fields%5B%5D=twitterUrl&fields%5B%5D=websiteUrl&fields%5B%5D=twitterImageUrl&filterByFormula=AND(%7Bpublished%7D%3D1%2C%7Btype%7D%3D%22Angel%22)",
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = await response.json();
  return data;
};

export default async function HomePage() {
  const data = await getInvestors();

  return <Dashboard data={data} />;
}
