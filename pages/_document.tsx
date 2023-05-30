import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="h-full bg-black">
      <Head>
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
        />
        <meta property="og:title" content="Papermark" />
        <meta
          property="og:description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
        />
        <meta
          property="og:image"
          content="https://www.papermark.io/meta-image.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@mfts0" />
        <meta name="twitter:creator" content="@mfts0" />
        <meta name="twitter:title" content="Papermark" />
        <meta
          name="twitter:description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
        />
        <meta
          name="twitter:image"
          content="https://www.papermark.io/meta-image.png"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
