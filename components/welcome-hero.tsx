"use client";

import { useSession } from "next-auth/react";
import { BuildingArt, FlagMark } from "./brand";
import { useT } from "./providers";

/** Dashboard hero: greeting, portal title, subtitle, building line-art and the tagline */
export function WelcomeHero({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  const { t } = useT();
  const { data } = useSession();
  const first = data?.user?.name?.replace(/^(Dr\.|Prof\.|Shri|Smt\.)\s+/, "").split(" ")[0];
  return (
    <section className="relative mb-6 overflow-hidden rounded border border-line bg-white px-6 py-6 shadow-card">
      <BuildingArt className="pointer-events-none absolute -right-4 bottom-0 hidden h-[130px] w-[300px] opacity-80 md:block" />
      <div className="relative max-w-2xl">
        <p className="text-base text-ink">
          {t("welcomeBack")}
          {first ? `, ${first}` : ","}
        </p>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight text-navy">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        {actions && <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="absolute right-6 top-5 hidden text-right text-sm font-medium leading-snug text-navy lg:block">
        <p>Quality Education</p>
        <p>Stronger Institutions</p>
        <p className="flex items-center justify-end gap-2 font-semibold">
          Brighter India <FlagMark className="h-3 w-9" />
        </p>
      </div>
    </section>
  );
}
