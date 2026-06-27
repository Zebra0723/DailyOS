import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DailyOS — Your life admin, finally handled.",
  description:
    "Drop in receipts, bookings, school letters, screenshots, PDFs and reminders. DailyOS sorts them into tasks, calendar events and a searchable vault.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "DailyOS — Your life admin, finally handled.",
    description: "DailyOS turns life admin into handled.",
    type: "website",
  },
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
