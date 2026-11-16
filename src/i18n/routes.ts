import { ui } from "./ui";

export type Lang = keyof typeof ui;
export type PageKey = "about" | "countries" | "trips" | "contact" | "reviews" | "privacy";

export const langs = Object.keys(ui) as Lang[];
export const pageKeys: PageKey[] = ["about", "countries", "trips", "contact", "reviews", "privacy"];

const slugOf = (lang: Lang, key: PageKey) =>
  (ui[lang] as Record<string, string>)[`slug.${key}`];

/** Builds an internal path that always ends with a slash: /pl/kraje/wietnam/ */
export function localePath(lang: Lang, ...segments: (string | undefined)[]) {
  const parts = [lang, ...segments]
    .filter(Boolean)
    .map((s) => String(s).replace(/^\/+|\/+$/g, ""));
  return `/${parts.join("/")}/`;
}

export const homePath = (lang: Lang) => localePath(lang);
export const pagePath = (lang: Lang, key: PageKey) =>
  localePath(lang, slugOf(lang, key));
export const countryPath = (lang: Lang, slug: string) =>
  localePath(lang, slugOf(lang, "countries"), slug);

export const segmentsOf = (pathname: string) =>
  pathname.split("/").filter(Boolean);

/** Which top-level page a path belongs to, if any. */
export function pageKeyOf(pathname: string): PageKey | undefined {
  const [lang, first] = segmentsOf(pathname);
  if (!first || !(lang in ui)) return undefined;
  return pageKeys.find((key) => slugOf(lang as Lang, key) === first);
}

/** True when `pathname` is `target` or sits below it. Used for the active nav item. */
export const isActive = (pathname: string, target: string) =>
  `${pathname.replace(/\/+$/, "")}/`.startsWith(target);
