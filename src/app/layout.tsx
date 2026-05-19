import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}
