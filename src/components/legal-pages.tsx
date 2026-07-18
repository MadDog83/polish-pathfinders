import { getDict, type Locale } from "@/i18n";

export function PrivacyPage({ locale }: { locale: Locale }) {
  const t = getDict(locale).privacy;
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t.heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.updated}</p>
      <p className="mt-6 text-base text-muted-foreground">{t.dataController}</p>
      <div className="mt-8 space-y-6">
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}

export function TermsPage({ locale }: { locale: Locale }) {
  const t = getDict(locale).terms;
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t.heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.updated}</p>
      <div className="mt-8 space-y-6">
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
