import { Footer, PublicNav, SiteHeader, TricolourStrip, UtilityBar } from "@/components/chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TricolourStrip />
      <UtilityBar />
      <SiteHeader />
      <PublicNav />
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
