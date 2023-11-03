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
import Loglib from "@loglib/tracker/react";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] , variable:"--font-inter"});

const clash = localFont({
  src: "../public/_fonts/cd-semi.otf",
  variable: "--font-clash",
});
const product = localFont({
  src:'../public/_fonts/product-google.ttf',
  variable:"--font-product"
})
const product2 = localFont({
  src:'../public/_fonts/product-google-regular.ttf',
  variable:"--font-product2"
})
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
            <main className={cn(inter.variable , clash.variable , product2.variable)}>
              <Toaster closeButton richColors theme={"system"} />
              <Component {...pageProps} />
              <Loglib
                config={{
                  id: "postmark",
                }}
              />
            </main>
          </PlausibleProvider>
        </ThemeProvider>
        <Analytics />
      </SessionProvider>
    </>
  );
}
