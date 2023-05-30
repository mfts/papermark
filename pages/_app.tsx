import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <>
      <Head>
        <title>Papermark</title>
      </Head>
      <SessionProvider session={session}>
        <main className={inter.className}>
          <Toaster position="top-right" reverseOrder={false} />
          <Component {...pageProps} />
        </main>
      </SessionProvider>
    </>
  );
}
