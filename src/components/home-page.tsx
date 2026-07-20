import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Home as HomeIcon, ShieldCheck, UserCheck, Sparkles, ExternalLink } from "lucide-react";
import { SITE_NAME, getDict, localePath, type Locale } from "@/i18n";
import { listNewsPublic } from "@/lib/news.functions";

const ICONS = [FileText, HomeIcon, ShieldCheck, UserCheck];

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const listNews = useServerFn(listNewsPublic);

  const { data: news } = useQuery({
    queryKey: ["news", locale, "home"],
    queryFn: () => listNews({ data: { language: locale, limit: 3 } }),
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  const legalServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: SITE_NAME,
    description: t.meta.homeDescription,
    areaServed: "Poland",
    availableLanguage: ["Ukrainian", "English", "Polish"],
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.10),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <Badge variant="secondary" className="mb-4">{t.hero.eyebrow}</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t.hero.h1}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">{t.hero.lead}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#faq">{t.hero.ctaSecondary}<ArrowRight className="ml-1 h-4 w-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#services">{t.services.heading}</a>
              </Button>
            </div>
            {t.hero.bullets.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {t.hero.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-accent" />{b}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70"
              alt="Professional legal consultation"
              width={1200}
              height={800}
              fetchPriority="high"
              decoding="async"
              className="aspect-[3/2] w-full rounded-xl border border-border/60 object-cover shadow-sm"
            />
          </div>
        </div>
      </section>


      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.services.heading}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.services.items.map((item, i) => {
            const Icon = ICONS[i] ?? FileText;
            return (
              <Card key={item.title} className="border-border/60 transition hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href={`#${item.faqAnchor}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    {t.hero.ctaSecondary} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-card/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.howItWorks.heading}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {t.howItWorks.steps.map((s) => (
              <Card key={s.title} className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <CardDescription>{s.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.faq.heading}</h2>
        <p className="mt-2 text-muted-foreground">{t.faq.lead}</p>
        <Accordion type="multiple" className="mt-6">
          {t.faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} id={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                <h3 className="scroll-mt-24">{item.q}</h3>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 text-xs text-muted-foreground">{t.currencyNote}</p>
      </section>

      {/* News */}
      <section className="border-t border-border/60 bg-card/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.news.heading}</h2>
              <p className="mt-2 text-muted-foreground">{t.news.lead}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to={localePath(locale, "/news")}>{t.news.seeAll} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(news ?? []).map((n) => (
              <Card key={n.id} className="border-border/60">
                <CardHeader>
                  <div className="text-xs text-muted-foreground">{new Date(n.published_at).toLocaleDateString(locale)}</div>
                  <CardTitle className="text-base">
                    <Link to={localePath(locale, `/news/${n.slug}`)} className="hover:underline">{n.title}</Link>
                  </CardTitle>
                  <CardDescription>{n.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <Link to={localePath(locale, `/news/${n.slug}`)} className="text-primary hover:underline">{t.news.readMore}</Link>
                  {n.source_url && (
                    <a href={n.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      {t.news.source} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.about.heading}</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
          {t.about.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">{t.about.refs}</p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(legalServiceJsonLd) }}
      />
    </>
  );
}
