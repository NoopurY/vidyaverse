import type { Metadata, Viewport } from "next";
<<<<<<< HEAD
import { cookies } from "next/headers";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Footer, SiteHeader, TricolourStrip, UtilityBar } from "@/components/chrome";
import type { Lang } from "@/lib/i18n";

const noto = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-noto", display: "swap" });
const notoDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600"], variable: "--font-noto-deva", display: "swap" });

export const metadata: Metadata = {
  title: { default: "VidyaVerse – APAAR Student Data & Verification Portal", template: "%s | VidyaVerse (AICTE)" },
  description: "AICTE portal for APAAR-linked student data submission, validation, fraud prevention, analytics and consent-based verification.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B3D91" };
=======
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import type { Lang } from "@/lib/i18n";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "VidyaVerse – APAAR Student Identity & Verification Platform",
    template: "%s | VidyaVerse (AICTE)",
  },
  description:
    "AICTE portal for APAAR-linked student data submission, validation, digital seat ledger enforcement, analytics, and consent-based verification.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B3D91",
};
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const c = cookies().get("lang")?.value;
  const lang: Lang = c === "hi" || c === "mr" ? c : "en";
  return (
<<<<<<< HEAD
    <html lang={lang === "en" ? "en-IN" : lang} className={`${noto.variable} ${notoDeva.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers initialLang={lang}>
          <TricolourStrip />
          <UtilityBar />
          <SiteHeader />
          {children}
          <Footer />
        </Providers>
=======
    <html lang={lang === "en" ? "en-IN" : lang} className={`${jakarta.variable} ${hand.variable}`}>
      <body className="min-h-screen font-sans bg-[#F5F8FC] text-[#152238] antialiased">
        <Providers initialLang={lang}>{children}</Providers>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      </body>
    </html>
  );
}
