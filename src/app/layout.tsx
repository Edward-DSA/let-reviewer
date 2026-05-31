import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./splash.css";
import SplashScreen from "@/components/SplashScreen";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

// Force dynamic so layout never pre-renders at build time (avoids DB errors)
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

import { prisma } from "@/lib/prisma";

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: '#6366f1',
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    viewportFit: 'cover',
  };
}

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
    icons: {
      icon: "/logo.png",
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: appName,
    },
    formatDetection: {
      telephone: false,
    },
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
        {/* PWA essential meta tags */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={appName} />
        <meta name="application-name" content={appName} />

        {/* Explicit manifest link (belt-and-suspenders alongside Next.js metadata) */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/logo.png" type="image/png" />

        {/* Viewport for PWA */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover"
        />

        {/* Splash screen flash prevention */}
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

        {/* Service Worker registration — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[PWA] Service worker registered. Scope:', reg.scope);

                      // Prefetch main HTML routes to store them in pages-cache for offline access
                      setTimeout(function() {
                        if (navigator.onLine) {
                          window.dispatchEvent(new CustomEvent('offline-caching-start'));
                          var routes = ['/study', '/study/profile', '/study/results', '/offline'];
                          var loaded = 0;
                          routes.forEach(function(route) {
                            fetch(route)
                              .then(function() {
                                loaded++;
                                if (loaded === routes.length) {
                                  window.dispatchEvent(new CustomEvent('offline-caching-main-done'));
                                }
                              })
                              .catch(function(err) {});
                          });
                        }
                      }, 2000);

                      // When a new SW is waiting, tell it to skip waiting and take over immediately
                      reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                          });
                        }
                      });

                      // When controller changes, reload to pick up the new SW version
                      navigator.serviceWorker.addEventListener('controllerchange', function() {
                        window.location.reload();
                      });
                    })
                    .catch(function(err) {
                      console.warn('[PWA] Service worker registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <SplashScreen logoUrl={logoUrl} appName={appName} />
        <PWAInstallPrompt appName={appName} />
        <main>{children}</main>
      </body>
    </html>
  );
}
