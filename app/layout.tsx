import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const c = cookies().get("lang")?.value;
  const lang: Lang = c === "hi" || c === "mr" ? c : "en";
  return (
    <html lang={lang === "en" ? "en-IN" : lang} className={`${jakarta.variable} ${hand.variable}`}>
      <body className="min-h-screen font-sans bg-[#F5F8FC] text-[#152238] antialiased">
        <Providers initialLang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
