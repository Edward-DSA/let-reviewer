import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./splash.css";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  let appName = "LET Reviewer PWA";
  try {
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (settings?.appName) appName = settings.appName;
  } catch (e) {
    console.error(e);
  }
  
  return {
    title: appName,
    description: "Offline-capable LET Reviewer application for students and teachers.",
    manifest: "/manifest.json",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let appName = "LET Reviewer PWA";
  let logoUrl = "/logo.png";

  try {
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (settings?.appName) appName = settings.appName;
    if (settings?.logoUrl) logoUrl = settings.logoUrl;
  } catch (e) {
    console.error(e);
  }

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash')) {
                  document.documentElement.classList.add('hide-splash-screen');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <SplashScreen logoUrl={logoUrl} appName={appName} />
        <main>{children}</main>
      </body>
    </html>
  );
}

