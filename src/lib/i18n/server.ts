import { cookies } from "next/headers";
import type { Lang } from "@/lib/types";
import { translate, type DictKey } from "@/lib/i18n/dict";

export const LANG_COOKIE = "haki_lang";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "ar" ? "ar" : "en";
}

/** Server-side translator. */
export function makeT(lang: Lang) {
  return (key: DictKey, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
}
