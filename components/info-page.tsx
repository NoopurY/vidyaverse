<<<<<<< HEAD
import { Card } from "./ui";

/** Static content page (Help, Privacy, Terms, Accessibility, Contact, About) */
export function InfoPage({ title, intro, sections }: { title: string; intro?: string; sections: { heading: string; body: React.ReactNode }[] }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="page-title">{title}</h1>
      {intro && <p className="mt-2 text-muted">{intro}</p>}
      <Card className="mt-6 divide-y divide-line">
        {sections.map((s) => (
          <section key={s.heading} className="p-6">
            <h2 className="card-title">{s.heading}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink">{s.body}</div>
=======
import { ShieldCheck } from "lucide-react";
import { Card } from "./ui";

/** Reusable structured content page for Help, Privacy, Terms, Accessibility, Contact, About */
export function InfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: { heading: string; body: React.ReactNode }[];
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-light px-3 py-1 text-xs font-semibold text-navy mb-3">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>VidyaVerse Official Documentation</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h1>
        {intro && <p className="mt-2 text-sm md:text-base text-muted leading-relaxed max-w-3xl">{intro}</p>}
      </div>

      <Card className="divide-y divide-line shadow-card border border-line">
        {sections.map((s) => (
          <section key={s.heading} className="p-6 sm:p-8">
            <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight mb-2">{s.heading}</h2>
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-muted">{s.body}</div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
          </section>
        ))}
      </Card>
    </div>
  );
}
