"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { useT } from "./providers";

/** Dashboard hero banner: user greeting, role title, subtitle, and contextual action buttons */
export function WelcomeHero({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  const { t } = useT();
  const { data } = useSession();
  const first = data?.user?.name?.replace(/^(Dr\.|Prof\.|Shri|Smt\.)\s+/, "").split(" ")[0];

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card">
      {/* Background subtle geometry */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-80 opacity-40 bg-[radial-gradient(#0B3D91_1px,transparent_1px)] [background-size:16px_16px] [mask-image:linear-gradient(to_left,white,transparent)]"
        aria-hidden
      />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-light px-2.5 py-0.5 text-xs font-semibold text-navy">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>
              {t("welcomeBack")}
              {first ? `, ${first}` : ""}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
          <p className="mt-1.5 text-xs md:text-sm text-muted leading-relaxed max-w-2xl">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
