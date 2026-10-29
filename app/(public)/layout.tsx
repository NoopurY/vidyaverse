import { PublicNav } from "@/components/chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </>
  );
}
