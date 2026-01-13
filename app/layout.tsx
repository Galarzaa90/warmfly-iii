import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import ServiceWorker from "./components/service-worker";
import NavLinks from "./components/nav-links";
import NavTitle from "./components/nav-title";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Warmfly III",
  description: "A focused, dark-first view into Firefly III expenses.",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icon.svg" }],
};

const theme = createTheme({
  fontFamily: `${spaceGrotesk.style.fontFamily}, sans-serif`,
  fontFamilyMonospace: `${jetBrainsMono.style.fontFamily}, monospace`,
  headings: { fontFamily: `${spaceGrotesk.style.fontFamily}, sans-serif` },
  primaryColor: "teal",
  defaultRadius: "md",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <header
            style={{
              borderBottom: "1px solid var(--app-border)",
              background: "rgba(6, 8, 15, 0.6)",
              backdropFilter: "blur(12px)",
            }}
          >
            <nav
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  fontSize: 18,
                }}
              >
                <NavTitle />
              </div>
              <Suspense
                fallback={
                  <div style={{ display: "flex", gap: 16 }}>
                    <span>Overview</span>
                    <span>Transactions</span>
                  </div>
                }
              >
                <NavLinks />
              </Suspense>
            </nav>
          </header>
          {children}
          <ServiceWorker />
        </MantineProvider>
      </body>
    </html>
  );
}
