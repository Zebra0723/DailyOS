import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

// The same two typefaces as the DailyOS app: Fraunces (display serif) + Inter.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DailyOS — The Pitch",
  description:
    "DailyOS organises your life admin so nothing slips. Who we are, what we've built, and why social media is the key to reaching the people we can help.",
  manifest: "/manifest.webmanifest",
  applicationName: "DailyOS Pitch",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DailyOS Pitch",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/favicon-32.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#bf502b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
