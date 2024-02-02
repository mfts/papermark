import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import PlausibleProvider from "next-plausible";
import { ThemeProvider } from "@/components/theme-provider";
import { TeamProvider } from "@/context/team-context";

const inter = Inter({ subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <>
      <Head>
        <title>Papermark | The Open Source DocSend Alternative</title>
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          key="description"
        />
        <meta
          property="og:title"
          content="Papermark | The Open Source DocSend Alternative"
          key="og-title"
        />
        <meta
          property="og:description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          key="og-description"
        />
        <meta
          property="og:image"
          content="https://www.papermark.io/_static/meta-image.png"
          key="og-image"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@papermarkio" />
        <meta name="twitter:creator" content="@papermarkio" />
        <meta name="twitter:title" content="Papermark" key="tw-title" />
        <meta
          name="twitter:description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          key="tw-description"
        />
        <meta
          name="twitter:image"
          content="https://www.papermark.io/_static/meta-image.png"
          key="tw-image"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PlausibleProvider
            domain="papermark.io"
            enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === "production"}
          >
            <main className={inter.className}>
              <Toaster closeButton richColors />
              <TeamProvider>
                <Component {...pageProps} />
              </TeamProvider>
            </main>
          </PlausibleProvider>
        </ThemeProvider>
        <Analytics />
      </SessionProvider>
    </>
  );
}
