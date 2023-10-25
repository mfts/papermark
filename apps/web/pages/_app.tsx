import "ui/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import PlausibleProvider from "next-plausible";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <>
      <Head>
        <title>Papermark | The Open Source DocSend Alternative</title>
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PlausibleProvider
            domain="papermark.io"
            enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === "production"}
          >
            <main className={inter.className}>
              <Toaster closeButton richColors theme={"system"} />
              <Component {...pageProps} />
            </main>
          </PlausibleProvider>
        </ThemeProvider>
        <Analytics />
      </SessionProvider>
    </>
  );
}
