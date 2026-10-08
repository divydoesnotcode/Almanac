import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import Script from "next/script";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/* ── CFO design-system fonts — loaded once here, available everywhere ── */
const cfoDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cfo-display",
  display: "swap",
});

const cfoSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cfo-sans",
  display: "swap",
});

const cfoMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cfo-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Almanac — Understand your money",
  description:
    "Your private AI CFO. Know your real cash position, spot leaks, track goals, and get clear next steps from your actual ledger.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cfoDisplay.variable} ${cfoSans.variable} ${cfoMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="cfo-theme" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
