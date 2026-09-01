import Link from "next/link";
import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { ArrowLeft } from "lucide-react";

// Sitefold's brand serif, so the wordmark matches their own site.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Affiliates · DailyOS",
  description: "The companies affiliated with DailyOS.",
};

/**
 * The Sitefold logo, recreated as vector art (not the low-res JPG): a folded
 * sheet of paper + the wordmark. Vector = infinitely sharp, one seamless piece
 * (no divider line), and it inherits currentColor so it renders crisp white on
 * the black page. Sized large; the page scrolls.
 */
function SitefoldLogo() {
  return (
    <span className="inline-flex items-center gap-6 text-white sm:gap-10">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-28 w-28 shrink-0 sm:h-44 sm:w-44"
        aria-hidden="true"
      >
        {/* A sheet of paper with the top-right corner folded — one continuous
            outline, so there's no line running through the middle. */}
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      <span
        className={`${serif.className} text-7xl leading-none sm:text-[11rem]`}
      >
        Sitefold
      </span>
    </span>
  );
}

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/about"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" /> About us
        </Link>
        <span className="text-sm text-white/40">DailyOS affiliates</span>
      </header>

      <main className="px-6 pb-24 pt-10 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Our affiliates
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/50 sm:text-lg">
            The companies that are part of the DailyOS family. Tap a logo to
            visit them.
          </p>

          {/* Sitefold — click the logo to go to the live site. */}
          <div className="mt-20 border-t border-white/10 pt-16">
            <a
              href="https://sitefold.dailyos.uk"
              className="group block outline-none"
              aria-label="Visit Sitefold"
            >
              <div className="flex justify-center py-10 transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80">
                <SitefoldLogo />
              </div>
              <p className="mt-6 text-center text-sm text-white/40">
                Sitefold — independent web design studio · sitefold.dailyos.uk
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
