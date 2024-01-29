import { Metadata } from "next";
import Dashboard from "./ClientPage";

export const revalidate = 3600; // revalidate the data at most every 24 hours

const data = {
  description:
    "Find over 10,000 investors based on stage, sector, or location. Powered by Papermark.",
  title: "Investor Search | Papermark",
  url: "https://www.papermark.io/investors",
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
        url: "https://www.papermark.io/_static/investor-meta.png",
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
    images: ["https://www.papermark.io/_static/investor-meta.png"],
  },
};

const getInvestors = async () => {
  const response = await fetch(`https://investors.papermark.io/api/investors`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INVESTORS_API_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = await response.json();
  return data;
};

export default async function HomePage() {
  const data = await getInvestors();
  // const data = [
  //   {id: 1,
  //   name: "test"}
  // ]

  return <Dashboard data={data} />;
}
