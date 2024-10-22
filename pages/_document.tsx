import { Head, Html, Main, NextScript } from "next/document";

// TODO: Initial commit
// Looking at code and determining best possible way to achieve it

export default function Document() {
  return (
    <Html lang="en" className="h-full bg-background" suppressHydrationWarning>
      <Head />
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
