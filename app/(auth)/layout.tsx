import { Inter } from "next/font/google";
import Head from "next/head";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";

import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Papermark | The Open Source DocSend Alternative</title>
      </Head>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <main className={inter.className}>
          <Toaster closeButton richColors theme={"system"} />

          <div>{children}</div>
        </main>
      </ThemeProvider>
    </>
  );
}
