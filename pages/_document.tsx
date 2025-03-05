import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="bg-background" suppressHydrationWarning>
      <Head />
      <body className="">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
