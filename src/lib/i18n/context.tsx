"use client";

import { createContext, useContext } from "react";
import type { Dir, Lang } from "@/lib/types";
import { translate, type DictKey } from "@/lib/i18n/dict";

type I18nValue = {
  lang: Lang;
  dir: Dir;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  dir: "ltr",
  t: (key) => translate("en", key),
});

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider
      value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t: (key, vars) => translate(lang, key, vars) }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
