import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Head from "next/head";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Papermark | The Open Source DocSend Alternative</title>
      </Head>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <main className={inter.className}>
          <Toaster closeButton richColors theme={"system"} />

          <div>{children}</div>
        </main>
      </ThemeProvider>
    </>
  );
}
