import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}
/** "32 opinie", "35 opinii", "1 opinia" / "1 review", "32 reviews". */
export function reviewsLabel(lang: string, n: number): string {
  if (lang !== "pl") return `${n} ${n === 1 ? "review" : "reviews"}`;
  const last = n % 10, lastTwo = n % 100;
  if (n === 1) return `${n} opinia`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} opinie`;
  return `${n} opinii`;
}
