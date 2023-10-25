import { Inter, JetBrains_Mono } from "@next/font/google"; // eslint-disable-line

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
