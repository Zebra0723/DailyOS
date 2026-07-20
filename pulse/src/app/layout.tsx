import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "DailyOS Pulse",
  description: "Live health and ops for DailyOS.",
  manifest: "/manifest.webmanifest",
  applicationName: "DailyOS Pulse",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DailyOS Pulse" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = { themeColor: "#e11d48" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
