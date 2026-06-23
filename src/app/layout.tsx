import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { THEME_VARS_BY_KEY, DEFAULT_THEME_KEY } from "@/lib/themes";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
  // Apply the saved accent theme before first paint to avoid a colour flash.
  const themeScript = `(function(){try{var k=localStorage.getItem('dailyos-theme')||'${DEFAULT_THEME_KEY}';var m=${JSON.stringify(
    THEME_VARS_BY_KEY,
  )};var v=m[k];if(v){var r=document.documentElement;for(var p in v){r.style.setProperty(p,v[p]);}}}catch(e){}})();`;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
