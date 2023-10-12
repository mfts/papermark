import { Metadata } from "next";
import { Navbar, Providers } from "@/components";
import { TailwindIndicator, Toaster } from "ui";
import { fontSans } from "ui/lib/fonts";
import { cn } from "ui/lib/utils";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/session";
import "ui/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
}

const RootLayout = async ({ children, modal }: RootLayoutProps) => {
  const user = await getCurrentUser();

  return (
    // Until next-themes fixes SSR, the 'suppressHydrationWarning' prop is needed.
    // https://github.com/pacocoursey/next-themes/issues/169
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar user={user} />
            <div className="flex-1 relative isolate">
              {children}
              {modal}
            </div>
          </div>
          <Toaster />
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
