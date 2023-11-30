import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
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
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PlausibleProvider
            domain="papermark.io"
            enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === "production"}
          >
            <main className={inter.className}>
              <Toaster closeButton richColors theme={"system"} />
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
