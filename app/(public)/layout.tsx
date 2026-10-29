<<<<<<< HEAD
import { PublicNav } from "@/components/chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </>
=======
import { Footer } from "@/components/chrome";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}
