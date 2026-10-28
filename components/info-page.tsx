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
          </section>
        ))}
      </Card>
    </div>
  );
}
