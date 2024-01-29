import { Metadata } from "next";
import Script from "next/script";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Script src="https://iuliia2.marbleflows.com/flows/8687" />
    </>
  );
}
