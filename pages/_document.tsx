import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en" className="h-full bg-background" suppressHydrationWarning>
      <Head>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/handsontable/6.2.2/handsontable.full.min.js"
          strategy="beforeInteractive"
        />
      </Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
