import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="h-full bg-background" suppressHydrationWarning>
      <Head>
        {process.env.NEXT_PUBLIC_TOLT_REFERRAL_ID && (
          <script
            async
            src="https://cdn.tolt.io/tolt.js"
            data-tolt={process.env.NEXT_PUBLIC_TOLT_REFERRAL_ID}
          />
        )}
      </Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
