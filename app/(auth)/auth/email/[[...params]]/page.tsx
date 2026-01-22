import { Metadata } from "next";

import EmailVerificationClient from "./page-client";

const data = {
  description: "Verify your login to Papermark",
  title: "Verify Login | Papermark",
  url: "/auth/email",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.papermark.com"),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Papermark",
    images: [
      {
        url: "/_static/meta-image.png",
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
    images: ["/_static/meta-image.png"],
  },
};

export default async function EmailVerificationPage({
  params,
}: {
  params: { params?: string[] };
}) {
  // Extract email, code, and uuid from params
  // URL format: /auth/email/{email}/{code}/{uuid}
  const [encodedEmail, code, uuid] = params.params || [];
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : undefined;

  return (
    <EmailVerificationClient
      email={email}
      code={code}
      uuid={uuid}
      autoVerify={!!(email && code && uuid)}
    />
  );
}
