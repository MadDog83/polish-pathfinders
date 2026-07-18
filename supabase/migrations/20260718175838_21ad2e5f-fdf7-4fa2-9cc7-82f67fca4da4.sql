-- ===== Roles system =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===== Leads =====
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  service TEXT NOT NULL,
  language TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a lead as long as consent is true
CREATE POLICY "Anyone can submit a lead with consent" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (consent = true);

-- Only admins can read leads
CREATE POLICY "Admins can view all leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== News =====
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  source_url TEXT,
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, language)
);

GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published news" ON public.news
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage news" ON public.news
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX news_lang_pub_idx ON public.news (language, is_published, published_at DESC);

-- Seed 3 news items per language
INSERT INTO public.news (slug, language, title, summary, source_url, published_at) VALUES
  ('mos-portal-2026', 'uk', 'Заяви лише через портал MOS з 27 квітня 2026', 'Від 27 квітня 2026 заяви на тимчасове, постійне перебування та резидента ЄС подаються виключно електронно через портал MOS.', 'https://www.gov.pl/web/udsc', '2026-03-15'),
  ('cukr-deadline', 'uk', 'CUKR для громадян України: подання до 4 березня 2027', 'Заяви на CUKR подаються електронно в порталі MOS до 4 березня 2027. Вартість — 340 злотих плюс 100 злотих за карту.', 'https://www.gov.pl/web/udsc', '2026-05-10'),
  ('inpol-status', 'uk', 'Як відстежити статус у порталі inPOL', 'Після подання заяви ви можете перевірити статус справи в порталі inPOL Мазовецького воєводства.', 'https://inpol.mazowieckie.pl', '2026-06-01'),

  ('mos-portal-2026', 'en', 'Applications move to MOS portal only from 27 April 2026', 'From 27 April 2026 temporary, permanent and EU long-term resident applications are filed exclusively online through the MOS portal.', 'https://www.gov.pl/web/udsc', '2026-03-15'),
  ('cukr-deadline', 'en', 'CUKR for Ukrainian citizens: file by 4 March 2027', 'CUKR applications are filed online in the MOS portal until 4 March 2027. Cost: PLN 340 stamp duty plus PLN 100 for the card.', 'https://www.gov.pl/web/udsc', '2026-05-10'),
  ('inpol-status', 'en', 'How to track your case in the inPOL portal', 'After filing you can check case status in the Mazowieckie voivodeship inPOL portal.', 'https://inpol.mazowieckie.pl', '2026-06-01'),

  ('mos-portal-2026', 'pl', 'Od 27 kwietnia 2026 wnioski wyłącznie przez portal MOS', 'Od 27 kwietnia 2026 wnioski o pobyt czasowy, stały i rezydenta długoterminowego UE składa się wyłącznie elektronicznie przez portal MOS.', 'https://www.gov.pl/web/udsc', '2026-03-15'),
  ('cukr-deadline', 'pl', 'CUKR dla obywateli Ukrainy: termin 4 marca 2027', 'Wnioski o CUKR składa się elektronicznie w portalu MOS do 4 marca 2027. Koszt: 340 zł opłaty skarbowej plus 100 zł za kartę.', 'https://www.gov.pl/web/udsc', '2026-05-10'),
  ('inpol-status', 'pl', 'Jak śledzić status sprawy w portalu inPOL', 'Po złożeniu wniosku status sprawy sprawdzasz w portalu inPOL Mazowieckiego Urzędu Wojewódzkiego.', 'https://inpol.mazowieckie.pl', '2026-06-01');
