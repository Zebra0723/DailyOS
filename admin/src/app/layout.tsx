import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DailyOS Admin",
  description: "Control center for all things DailyOS.",
  manifest: "/manifest.webmanifest",
  applicationName: "DailyOS Admin",
  appleWebApp: { capable: true, title: "DOS Admin", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon-32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png?v=2",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f2e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
