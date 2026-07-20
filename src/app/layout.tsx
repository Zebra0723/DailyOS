import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { PwaRegister } from "@/components/pwa-register";

// Fraunces: a warm "old-style" serif — the editorial voice of the Almanac UI.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DailyOS — Your life admin, finally handled.",
  description:
    "Drop in receipts, bookings, school letters, screenshots, PDFs and reminders. DailyOS sorts them into tasks, calendar events and a searchable vault.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily-os-lac.vercel.app",
  ),
  applicationName: "DailyOS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DailyOS",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  keywords: [
    "life admin",
    "personal assistant",
    "AI organizer",
    "receipts to tasks",
    "calendar",
    "reminders",
    "family organizer",
  ],
  openGraph: {
    title: "DailyOS — Your life admin, finally handled.",
    description:
      "Drop in receipts, bookings, letters and screenshots. DailyOS turns them into tasks, calendar events and a searchable vault — automatically.",
    type: "website",
    siteName: "DailyOS",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyOS — Your life admin, finally handled.",
    description:
      "Drop in receipts, bookings, letters and screenshots. DailyOS turns them into tasks, calendar events and a searchable vault — automatically.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lock the zoom so the layout can't be pinched out to reveal empty space,
  // and so an accidental double-tap doesn't zoom the app like a web page.
  maximumScale: 1,
  userScalable: false,
  // Fill the whole screen on notched phones; we pad for the notch / home
  // indicator ourselves with env(safe-area-inset-*) so nothing is obscured.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e9" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Apply light/dark before first paint to avoid a flash.
  const themeScript = `(function(){try{var m=localStorage.getItem('dailyos-mode')||'system';var dark = m==='dark' || (m==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark', dark);}catch(e){}})();`;

  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
