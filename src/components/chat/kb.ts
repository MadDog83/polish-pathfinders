// Rule-based knowledge base for the chatbot. Keywords -> FAQ index in getDict(locale).faq.items.
import type { Locale } from "@/i18n";

type Rule = { keywords: string[]; faqIndex: number };

const RULES: Record<Locale, Rule[]> = {
  uk: [
    { keywords: ["чекати", "скільки чекати", "термін", "60 днів", "печатан", "друк"], faqIndex: 0 },
    { keywords: ["скільки коштує тимчас", "340", "100", "ціна карт", "вартість карт"], faqIndex: 1 },
    { keywords: ["mos", "мос", "подати", "заяв", "інпол", "inpol", "профіль довіри", "e-doręczen"], faqIndex: 2 },
    { keywords: ["документ", "паспорт", "фото", "відбитк"], faqIndex: 3 },
    { keywords: ["постійне", "пмп", "карта поляка", "5 рок", "3 рок", "стал"], faqIndex: 4 },
    { keywords: ["640", "ціна пост", "коштує пост"], faqIndex: 5 },
    { keywords: ["громадянство", "паспорт польськ", "натуралізац"], faqIndex: 6 },
    { keywords: ["1000", "b1", "мова", "визнан"], faqIndex: 7 },
    { keywords: ["cukr", "цукр", "укр", "тимчасовий захист", "ukr"], faqIndex: 8 },
    { keywords: ["шенген", "працю", "90 днів", "робот", "180"], faqIndex: 9 },
    { keywords: ["виїхати", "відсутність", "6 місяц", "10 місяц"], faqIndex: 10 },
    { keywords: ["відмов", "оскарж", "апеляц", "14 днів", "негативн"], faqIndex: 11 },
  ],
  en: [
    { keywords: ["how long", "wait", "60 days", "print"], faqIndex: 0 },
    { keywords: ["cost", "price", "340", "temporary card fee", "100"], faqIndex: 1 },
    { keywords: ["mos", "apply", "submit", "inpol", "trusted profile", "e-delivery"], faqIndex: 2 },
    { keywords: ["document", "passport", "photo", "fingerprint"], faqIndex: 3 },
    { keywords: ["permanent", "pr", "polish card", "years", "how many years"], faqIndex: 4 },
    { keywords: ["640", "permanent cost", "permanent price"], faqIndex: 5 },
    { keywords: ["citizenship", "polish passport", "naturali"], faqIndex: 6 },
    { keywords: ["1000", "b1", "language", "recognition"], faqIndex: 7 },
    { keywords: ["cukr", "ukrainian", "ukr", "temporary protection"], faqIndex: 8 },
    { keywords: ["schengen", "work", "90 days", "travel"], faqIndex: 9 },
    { keywords: ["leave", "absence", "6 months", "10 months"], faqIndex: 10 },
    { keywords: ["negative", "appeal", "refus", "14 days"], faqIndex: 11 },
  ],
  pl: [
    { keywords: ["ile czeka", "termin", "60 dni", "druk"], faqIndex: 0 },
    { keywords: ["ile kosztuje karta czasow", "340", "100", "cena karty", "opłata"], faqIndex: 1 },
    { keywords: ["mos", "wniosek", "złożyć", "inpol", "profil zaufany", "e-doręczen"], faqIndex: 2 },
    { keywords: ["dokument", "paszport", "zdjęcie", "odciski"], faqIndex: 3 },
    { keywords: ["pobyt stały", "stal", "karta polaka", "ile lat"], faqIndex: 4 },
    { keywords: ["640", "koszt pobyt", "cena pobyt"], faqIndex: 5 },
    { keywords: ["obywatelstwo", "paszport polski", "naturaliz"], faqIndex: 6 },
    { keywords: ["1000", "b1", "język", "uznanie"], faqIndex: 7 },
    { keywords: ["cukr", "ukr", "ukrai", "ochrona tymczas"], faqIndex: 8 },
    { keywords: ["schengen", "praca", "90 dni", "podróż"], faqIndex: 9 },
    { keywords: ["wyjechać", "nieobecność", "6 miesięcy", "10 miesięcy"], faqIndex: 10 },
    { keywords: ["odmow", "odwoła", "apel", "14 dni", "negatywn"], faqIndex: 11 },
  ],
};

export function matchFaq(locale: Locale, query: string): number | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const rules = RULES[locale];
  let best: { idx: number; score: number } | null = null;
  for (const r of rules) {
    let score = 0;
    for (const k of r.keywords) if (q.includes(k.toLowerCase())) score += k.length;
    if (score > 0 && (!best || score > best.score)) best = { idx: r.faqIndex, score };
  }
  return best ? best.idx : null;
}
