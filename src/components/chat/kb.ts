// Rule-based knowledge base for the chatbot. Keywords -> FAQ index in getDict(locale).faq.items.
import type { Locale } from "@/i18n";

type Rule = { keywords: string[]; faqIndex: number };

const RULES: Record<Locale, Rule[]> = {
  uk: [
    { keywords: ["чекати", "скільки чекати", "60 днів", "друк", "коштує", "вартість", "340", "440", "гербовий збір"], faqIndex: 0 },
    { keywords: ["mos", "мос", "подати", "заяв", "inpol", "інпол", "профіль довіри", "електронно"], faqIndex: 1 },
    { keywords: ["документ", "паспорт", "фото", "відбитк", "підпис"], faqIndex: 2 },
    { keywords: ["постійне", "постійного", "карта поляка", "640", "оселитися"], faqIndex: 3 },
    { keywords: ["резидент", "довгострокового", "довгострокове", "b1"], faqIndex: 4 },
    { keywords: ["громадянство", "громадянства", "натуралізац", "1000", "1669", "паспорт польськ"], faqIndex: 5 },
    { keywords: ["cukr", "цукр", "ukr", "укр", "тимчасовий захист", "4 березня"], faqIndex: 6 },
    { keywords: ["шенген", "працювати", "працю", "робот", "90 днів", "180"], faqIndex: 7 },
    { keywords: ["виїхати", "виїзд", "відсутність", "6 місяц", "10 місяц"], faqIndex: 8 },
    { keywords: ["відмов", "оскарж", "апеляц", "14 днів", "негативн", "керівника управління", "скарга"], faqIndex: 9 },
  ],
  en: [
    { keywords: ["how long", "wait", "60 days", "print", "cost", "price", "fee", "340", "440"], faqIndex: 0 },
    { keywords: ["mos", "apply", "submit", "application", "inpol", "trusted profile", "e-delivery"], faqIndex: 1 },
    { keywords: ["document", "passport", "photo", "fingerprint", "signature"], faqIndex: 2 },
    { keywords: ["permanent", "polish card", "640", "settle"], faqIndex: 3 },
    { keywords: ["long-term", "long term", "eu resident", "resident card", "b1"], faqIndex: 4 },
    { keywords: ["citizenship", "naturali", "1000", "1669", "polish passport"], faqIndex: 5 },
    { keywords: ["cukr", "ukr", "ukrain", "temporary protection", "4 march"], faqIndex: 6 },
    { keywords: ["schengen", "work", "90 days", "180", "travel"], faqIndex: 7 },
    { keywords: ["leave poland", "absence", "6 months", "10 months"], faqIndex: 8 },
    { keywords: ["negative", "appeal", "refus", "14 days", "head of the office", "complaint"], faqIndex: 9 },
  ],
  pl: [
    { keywords: ["ile czeka", "60 dni", "druk", "kosztuje", "koszt", "cena", "opłata", "340", "440"], faqIndex: 0 },
    { keywords: ["mos", "wniosek", "złożyć", "inpol", "profil zaufany", "e-doręczen", "elektronicznie"], faqIndex: 1 },
    { keywords: ["dokument", "paszport", "zdjęcie", "odciski", "podpis"], faqIndex: 2 },
    { keywords: ["pobyt stały", "stały", "karta polaka", "640", "osiedl"], faqIndex: 3 },
    { keywords: ["rezydent", "długotermin", "rezydenta ue", "b1"], faqIndex: 4 },
    { keywords: ["obywatelstwo", "naturaliz", "1000", "1669", "paszport polski"], faqIndex: 5 },
    { keywords: ["cukr", "ukr", "ukrai", "ochrona tymczas", "4 marca"], faqIndex: 6 },
    { keywords: ["schengen", "praca", "pracować", "90 dni", "180", "podróż"], faqIndex: 7 },
    { keywords: ["wyjechać", "nieobecność", "6 miesięcy", "10 miesięcy", "opuścić"], faqIndex: 8 },
    { keywords: ["odmow", "odwoła", "apel", "14 dni", "negatywn", "szefa urzędu", "skarga"], faqIndex: 9 },
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
