import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Oracle Wars",
  description: "Compare Oracle Prices in Real-time",
  keywords: [
    "oracle",
    "blockchain",
    "cryptocurrency",
    "price feed",
    "chainlink",
    "redstone",
  ],
  authors: [{ name: "Oracle Wars" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://oraclewars.xyz",
    title: "Oracle Wars",
    description: "Compare Oracle Prices in Real-time",
    siteName: "Oracle Wars",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oracle Wars",
    description: "Compare Oracle Prices in Real-time",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
