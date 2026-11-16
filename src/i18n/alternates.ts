import { getCollection } from "astro:content";
import {
  countryPath,
  homePath,
  langs,
  pageKeyOf,
  pagePath,
  segmentsOf,
  type Lang,
} from "./routes";

export type Alternates = Record<Lang, string>;

/**
 * Returns the same page in every language, keyed by language code, or null
 * when the page has no counterpart (404 pages, pages that exist in one
 * language only). Top-level pages are paired through the slugs in
 * settings.json; countries are paired through their shared `sortOrder`.
 */
export async function getAlternates(pathname: string): Promise<Alternates | null> {
  const [lang, first, second, ...rest] = segmentsOf(pathname);
  if (!langs.includes(lang as Lang) || rest.length) return null;

  if (!first) {
    return Object.fromEntries(langs.map((l) => [l, homePath(l)])) as Alternates;
  }

  const key = pageKeyOf(pathname);
  if (!key) return null;

  if (!second) {
    return Object.fromEntries(langs.map((l) => [l, pagePath(l, key)])) as Alternates;
  }

  if (key !== "countries") return null;

  const countries = await getCollection("country");
  const current = countries.find((c) => c.slug === `${lang}/${second}`);
  if (!current) return null;

  const result: Partial<Alternates> = {};
  for (const l of langs) {
    const twin = countries.find(
      (c) => c.slug.startsWith(`${l}/`) && c.data.sortOrder === current.data.sortOrder
    );
    if (!twin) return null;
    result[l] = countryPath(l, twin.slug.split("/").slice(1).join("/"));
  }
  return result as Alternates;
}
