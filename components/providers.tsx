"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { DICTS, type DictKey, type Lang } from "@/lib/i18n";
import { fetcher } from "@/lib/fetcher";

type I18n = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string };
const I18nCtx = createContext<I18n>({ lang: "en", setLang: () => {}, t: (k) => DICTS.en[k] });
export const useT = () => useContext(I18nCtx);

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l === "en" ? "en-IN" : l;
  }, []);
  const t = useCallback((k: DictKey) => DICTS[lang][k] ?? DICTS.en[k], [lang]);

  useEffect(() => {
    try {
      const fs = localStorage.getItem("fs");
      if (fs) document.documentElement.dataset.fs = fs;
    } catch {}
  }, []);

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
        <I18nCtx.Provider value={{ lang, setLang, t }}>
          {children}
          <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 5000 }} />
        </I18nCtx.Provider>
      </SWRConfig>
    </SessionProvider>
  );
}
