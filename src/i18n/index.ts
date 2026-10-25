// Central i18n. UA is default. Business name kept in English across all locales.
export const SITE_NAME = "Smart Legalization Support";
export const SITE_URL = "https://smart-legalization.lovable.app";
export const CURRENCY_DATE = "November 2026";
export const TELEGRAM_URL = "https://t.me/legalize_auto_bot";
export const CONTACT_EMAIL = "kontakt@smartlegalization.pl";
export const CONTACT_PHONE = "+48 XXX XXX XXX";

export const LOCALES = ["uk", "en", "pl"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uk";

export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "uk") return clean === "/" ? "/" : clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export type FaqItem = { q: string; a: string };

export interface Dict {
  htmlLang: string;
  hreflang: string;
  nav: {
    home: string;
    services: string;
    faq: string;
    news: string;
    about: string;
    admin: string;
  };
  header: { openChat: string; theme: { light: string; dark: string; system: string; toggle: string } };
  hero: {
    eyebrow: string;
    h1: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    bullets: string[];
  };
  services: {
    heading: string;
    items: { title: string; body: string; faqAnchor: string }[];
  };
  howItWorks: {
    heading: string;
    steps: { title: string; body: string }[];
  };
  faq: {
    heading: string;
    lead: string;
    items: FaqItem[];
  };
  news: {
    heading: string;
    lead: string;
    readMore: string;
    seeAll: string;
    source: string;
    latest: string;
    empty: string;
    back: string;
  };
  about: {
    heading: string;
    body: string[];
    refs: string;
  };
  currencyNote: string;
  footer: {
    tagline: string;
    rights: string;
    legal: string;
    privacy: string;
    terms: string;
    language: string;
  };
  chatbot: {
    title: string;
    subtitle: string;
    disclaimer: string;
    placeholder: string;
    send: string;
    noMatch: string;
    officialLinks: string;
    linkApplication: string;
    linkStatus: string;
    linkGeneral: string;
    personalHelp: string;
    endChat: string;
    endChatConfirm: string;
    confirmYes: string;
    confirmNo: string;
    minimize: string;
    expand: string;
    dragHint: string;
    formHeading: string;
    formLead: string;
    name: string;
    email: string;
    phone: string;
    service: string;
    consent: string;
    submit: string;
    submitting: string;
    revealTitle: string;
    revealLead: string;
    telegram: string;
    close: string;
    reopen: string;
    backToChat: string;
    services: string[];
    validationEmailOrPhone: string;
    validationConsent: string;
    validationName: string;
    thanks: string;
    error: string;
  };
  meta: {
    homeTitle: string;
    homeDescription: string;
    newsTitle: string;
    newsDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    termsTitle: string;
    termsDescription: string;
  };
  privacy: {
    heading: string;
    updated: string;
    dataController: string;
    sections: { h: string; body: string }[];
  };
  terms: {
    heading: string;
    updated: string;
    sections: { h: string; body: string }[];
  };
  auth: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    signIn: string;
    signUp: string;
    switchToSignUp: string;
    switchToSignIn: string;
    signOut: string;
    notAdmin: string;
  };
  admin: {
    title: string;
    totalLeads: string;
    last7: string;
    last30: string;
    byService: string;
    byLanguage: string;
    submissionsOverTime: string;
    leadsTable: string;
    date: string;
    name: string;
    contact: string;
    service: string;
    language: string;
    exportCsv: string;
    newsManage: string;
    addNews: string;
    slug: string;
    titleField: string;
    summary: string;
    sourceUrl: string;
    publishedAt: string;
    published: string;
    save: string;
    edit: string;
    delete: string;
    cancel: string;
  };
}

const UA: Dict = {
  htmlLang: "uk",
  hreflang: "uk",
  nav: { home: "Головна", services: "Послуги", faq: "Питання", news: "Новини", about: "Про нас", admin: "Адмін" },
  header: {
    openChat: "Відкрити чат",
    theme: { light: "Світла тема", dark: "Темна тема", system: "Системна тема", toggle: "Перемкнути тему" },
  },
  hero: {
    eyebrow: "Легалізація в Польщі",
    h1: `${SITE_NAME} — легалізація в Польщі без здогадок`,
    lead: "Карти побиту, постійне перебування, громадянство та дозволи на роботу.",
    ctaPrimary: "Задати питання боту",
    ctaSecondary: "Читати відповіді",
    bullets: [],
  },
  services: {
    heading: "Що ми охоплюємо",
    items: [
      { title: "Карта тимчасового побиту", body: "Терміни, збори, комплект документів, портал MOS та статус в inPOL.", faqAnchor: "faq-0" },
      { title: "Постійне перебування", body: "Підстави, необхідні роки, збори і виняток для Карти Поляка.", faqAnchor: "faq-3" },
      { title: "Громадянство Польщі", body: "Визнання воєводою або надання Президентом, вимоги до мови та документів.", faqAnchor: "faq-5" },
      { title: "CUKR для громадян України", body: "3-річний дозвіл, електронна подача до 4 березня 2027.", faqAnchor: "faq-6" },
    ],
  },
  howItWorks: {
    heading: "Як це працює",
    steps: [
      { title: "1. Виберіть питання", body: "Знайдіть відповідь у розділі питань нижче або відкрийте бота у правому нижньому куті." },
      { title: "2. Отримайте офіційне джерело", body: "Кожна відповідь спирається на gov.pl, MOS або inPOL." },
      { title: "3. Потрібна персональна допомога", body: "Залишіть контакт у боті та отримайте email, телефон і Telegram фахівця." },
    ],
  },
  faq: {
    heading: "Часті питання",
    lead: "Стислі відповіді на найпоширеніші питання про легалізацію в Польщі.",
    items: [
      { q: "Скільки часу та скільки коштує карта тимчасового побиту?", a: "За законом рішення видають протягом 60 днів. Строк рахують від останньої з подій: подання заяви без формальних недоліків (або їх усунення), особиста явка, подання витребуваних документів. До 4 березня 2027 перебіг цього строку призупинено, тож на практиці чекають довше. Гербовий збір за дозвіл: 440 злотих для підстави «перебування і праця» та Блакитної карти ЄС, 340 злотих для більшості інших підстав, 170 злотих для сезонної роботи. Окремо 100 злотих за саму карту (50 злотих для студентів, учнів і дітей до 16 років). У Мазовецькому воєводстві статус справи можна відстежувати в порталі inPOL." },
      { q: "Як подати заяву на тимчасове чи постійне перебування у 2026?", a: "Від 27 квітня 2026 заяви на тимчасове, постійне перебування та резидента ЄС подаються виключно електронно через портал MOS. Обліковий запис у MOS створюють після входу через державну систему ідентифікації (наприклад, Профіль Довіри — Profil Zaufany); серед даних облікового запису є номер PESEL та email. Воєвода зобов'язаний допомогти створити обліковий запис. Підтвердження про подання заяви надходить через MOS." },
      { q: "Які документи потрібні для карти тимчасового побиту?", a: "Основний комплект: заява (подається електронно через портал MOS), актуальне цифрове фото, дійсний паспорт, підтвердження сплати гербового збору та збору за карту побиту, а також документи, характерні для мети перебування (наприклад, для роботи — додаток від роботодавця та підтвердження медичного страхування). Відбитки пальців і зразок підпису знімають не при поданні заяви, а під час особистої явки, на яку воєвода викликає вже після подання (не раніше ніж за 7 днів). Якщо не усунути формальні недоліки (включно з неявкою для зняття відбитків), заява залишиться без розгляду." },
      { q: "Через скільки років і за яку плату можна отримати постійне перебування?", a: "Основні підстави (закон про іноземців, art. 195 ust. 1): дійсна Карта Поляка і намір оселитися; польське походження; діти громадян Польщі або діти іноземця з постійним перебуванням чи статусом резидента ЄС; подружжя громадян Польщі — після щонайменше 3 років шлюбу і водночас 2 років безперервного перебування на тимчасовому дозволі, пов'язаному з шлюбом; жертви торгівлі людьми — за певних умов, зокрема після 1 року на відповідному дозволі; 5 років безперервного перебування як біженець, з додатковим захистом чи гуманітарною згодою, або 10 років толерованого перебування; 4 роки на дозволі «перебування і праця» у професії, потрібній польській економіці, за стабільного доходу. Гербовий збір — 640 злотих плюс 100 злотих за карту; заява на підставі Карти Поляка звільнена від гербового збору. Сам дозвіл безстроковий, а карта дійсна 10 років і підлягає обміну." },
      { q: "Що таке карта резидента довгострокового перебування ЄС і чим вона відрізняється від постійного перебування?", a: "Це окремий статус: надається на невизначений строк за наявності не менше 5 років безперервного легального проживання в Польщі, стабільного доходу, медичного страхування та підтвердженого знання польської мови не нижче рівня B1 (для дітей до 16 років мовна вимога не діє). Сама карта видається на 5 років і підлягає обміну — на відміну від 10-річної карти постійного перебування. Гербовий збір за дозвіл — 640 злотих, плюс 100 злотих за карту." },
      { q: "Як і через скільки років можна отримати польське громадянство?", a: "Є два окремі шляхи. «Визнання громадянином» — рішення воєводи, якщо виконано умови закону про громадянство (art. 30). Найчастіше: 3 роки безперервного перебування на постійному побиті (або статусі резидента ЄС) за стабільного доходу й правового титулу на житло; для подружжя громадян Польщі — 2 роки на постійному побиті і водночас щонайменше 3 роки шлюбу; 1 рік на постійному побиті, отриманому через польське походження або Карту Поляка. Потрібне підтвердження польської мови на рівні B1. Гербовий збір — 1000 злотих. «Надання громадянства» — окреме дискреційне рішення Президента Польщі без строків і обов'язкових критеріїв, яке не можна оскаржити; гербовий збір — 1669 злотих." },
      { q: "Що таке карта побиту CUKR для громадян України?", a: "Карта побиту CUKR підтверджує дозвіл на тимчасове перебування на 3 роки на спеціальних умовах — для громадян України зі статусом UKR (тимчасовий захист), які приїхали до Польщі після 23 лютого 2022, та деяких членів їхніх родин. Умови: статус UKR безперервно щонайменше 365 днів і актуальний PESEL UKR як у день подання заяви, так і в день видачі карти. Заяви — лише електронно в MOS, до 4 березня 2027. Збір — 340 злотих плюс 100 злотих за карту. Карта дає повний доступ до ринку праці без окремого дозволу на роботу. Дати можуть змінюватися — ближче до них перевіряйте gov.pl/UDSC." },
      { q: "Чи дозволяє карта побиту працювати та подорожувати Шенгеном?", a: "Карта побиту разом із дійсним паспортом дає право перебувати в інших країнах Шенгену до 90 днів у кожні 180 днів. Право на роботу залежить від підстави дозволу: якщо воно є, на карті стоїть запис «dostęp do rynku pracy». Постійне перебування та CUKR дають повний доступ до ринку праці без окремого дозволу на роботу." },
      { q: "Чи можу я виїхати з Польщі під час процедури?", a: "Закон виїзду не забороняє, але підтвердження про подання заяви на тимчасове перебування лише засвідчує, що ваше перебування в Польщі законне, — це не документ для в'їзду. Повернутися можна тільки на іншій підставі (віза, безвізовий режим тощо), тому перед поїздкою уточніть це в управлінні воєводи. Якщо ви накопичуєте роки для постійного перебування чи громадянства, одна перерва не може перевищувати 6 місяців, а всі разом — 10 місяців. Для осіб зі статусом UKR виїзд з Польщі понад 30 днів сам по собі припиняє тимчасовий захист." },
      { q: "Що робити після негативного рішення?", a: "Рішення воєводи можна оскаржити до Керівника Управління у справах іноземців протягом 14 днів від вручення; оскарження подається через воєводу. Керівник має 90 днів на розгляд. Поки рішення не стало остаточним, тобто й під час оскарження, перебування залишається законним, якщо заяву подано вчасно. Рішення Керівника можна оскаржити до воєводського адміністративного суду протягом 30 днів, але сама скарга до суду не легалізує перебування. Варто звернутися до адвоката або організації правової допомоги." }
    ],
  },
  news: {
    heading: "Новини та зміни правил",
    lead: "Короткі оновлення з посиланнями на офіційні джерела.",
    readMore: "Читати далі",
    seeAll: "Усі новини",
    source: "Джерело",
    latest: "Останні новини",
    empty: "Новин поки немає.",
    back: "← До всіх новин",
  },
  about: {
    heading: `Про ${SITE_NAME}`,
    body: [
      `${SITE_NAME} — інформаційно-консультаційний сервіс, що допомагає іноземцям у процесі легалізації в Польщі. Ми спираємось на офіційні джерела — Urząd Wojewódzki, Ustawa o cudzoziemcach та Urząd do Spraw Cudzoziemców.`,
      "Ми пояснюємо процедуру мовою користувача, наводимо збори, терміни та посилання. Ми не є юридичною фірмою — рішення в конкретній справі приймають воєвода та Керівник Управління у справах іноземців.",
    ],
    refs: "Офіційні джерела: gov.pl/web/udsc, mos.cudzoziemcy.gov.pl, inpol.mazowieckie.pl",
  },
  currencyNote: "Завжди перевіряйте на gov.pl.",
  footer: {
    tagline: "Легалізація в Польщі — зрозуміло та актуально.",
    rights: `© 2026 ${SITE_NAME}. Усі права захищено.`,
    legal: "Правова інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови користування",
    language: "Мова",
  },
  chatbot: {
    title: `${SITE_NAME}`,
    subtitle: "Помічник з питань легалізації",
    disclaimer: "Загальна інформація, а не юридична консультація.",
    placeholder: "Напишіть питання — наприклад «скільки чекати картку побиту»",
    send: "Надіслати",
    noMatch: "Не знайшов точної відповіді. Спробуйте переформулювати або залишити контакт нижче — фахівець допоможе.",
    officialLinks: "Офіційні ресурси:",
    linkApplication: "Подати заяву — MOS",
    linkStatus: "Статус справи — inPOL",
    linkGeneral: "Загальна інформація — gov.pl/UDSC",
    personalHelp: "Хочу персональну допомогу",
    endChat: "Завершити чат",
    endChatConfirm: "Ви впевнені?",
    confirmYes: "Так",
    confirmNo: "Ні",
    minimize: "Згорнути",
    expand: "Розгорнути",
    dragHint: "Перемістити вікно чату",
    formHeading: "Залишити контакт",
    formLead: "Залиште контакт і ми надішлемо вам email, телефон і Telegram фахівця.",
    name: "Ім'я",
    email: "Email",
    phone: "Телефон",
    service: "Послуга",
    consent: "Я даю згоду на обробку моїх персональних даних відповідно до Політики конфіденційності.",
    submit: "Надіслати",
    submitting: "Надсилаємо...",
    revealTitle: "Дякуємо! Контакти фахівця:",
    revealLead: "Ми зв'яжемось якнайшвидше. Тим часом ви можете написати нам одразу:",
    telegram: "Відкрити Telegram-бот",
    close: "Закрити",
    reopen: "Відкрити чат",
    backToChat: "Повернутися до чату",
    services: ["Карта тимчасового побиту", "Постійне перебування", "Громадянство", "Дозвіл на роботу", "CUKR", "Інше"],
    validationEmailOrPhone: "Вкажіть email або телефон.",
    validationConsent: "Потрібна згода на обробку даних.",
    validationName: "Вкажіть ім'я.",
    thanks: "Дякуємо! Ми отримали ваш запит.",
    error: "Не вдалося надіслати. Спробуйте ще раз.",
  },
  meta: {
    homeTitle: `Легалізація в Польщі — ${SITE_NAME}`,
    homeDescription: "Актуальна інформація про карту побиту, постійне перебування, громадянство Польщі та CUKR — трьома мовами, з посиланнями на gov.pl, MOS та inPOL.",
    newsTitle: `Новини легалізації в Польщі — ${SITE_NAME}`,
    newsDescription: "Оновлення про зміни правил легалізації в Польщі — MOS, inPOL, CUKR — з посиланнями на офіційні джерела.",
    privacyTitle: `Політика конфіденційності — ${SITE_NAME}`,
    privacyDescription: `Як ${SITE_NAME} збирає та обробляє персональні дані згідно з GDPR.`,
    termsTitle: `Умови користування — ${SITE_NAME}`,
    termsDescription: `Умови використання сайту ${SITE_NAME}.`,
  },
  privacy: {
    heading: "Політика конфіденційності",
    updated: `Оновлено: ${CURRENCY_DATE}`,
    dataController: `Розпорядник даних: ${SITE_NAME}.`,
    sections: [
      { h: "Які дані ми збираємо", body: "Тільки ті, що ви добровільно надаєте через форму зв'язку в чат-боті: ім'я, email або телефон, обрана послуга, мова спілкування, дата та час надсилання." },
      { h: "Мета обробки", body: "Обробка звернень та надання інформації про послуги легалізації. Дані обробляються виключно за вашою згодою (GDPR ст. 6(1)(a))." },
      { h: "Термін зберігання", body: "Дані зберігаються не довше 24 місяців з моменту надсилання або до вашого запиту про видалення." },
      { h: "Ваші права", body: "Ви маєте право на доступ, виправлення, видалення, обмеження обробки та перенос даних. Для цього напишіть нам через чат-бот." },
      { h: "Передача третім особам", body: "Ми не передаємо ваші дані третім особам без вашої згоди, крім випадків, передбачених законом." },
      { h: "Cookies та аналітика", body: "Сайт не використовує сторонні аналітичні скрипти чи маркетингові cookies." },
    ],
  },
  terms: {
    heading: "Умови користування",
    updated: `Оновлено: ${CURRENCY_DATE}`,
    sections: [
      { h: "Загальна інформація", body: `Матеріали сайту ${SITE_NAME} мають виключно інформаційний характер і не є юридичною консультацією. Рішення у конкретних справах ухвалює воєвода та Керівник Управління у справах іноземців.` },
      { h: "Актуальність", body: "Ми намагаємось підтримувати інформацію актуальною, але завжди перевіряйте деталі на gov.pl та в порталі MOS." },
      { h: "Відповідальність", body: "Ми не несемо відповідальності за рішення, ухвалені на підставі інформації з цього сайту без консультації з фахівцем." },
      { h: "Контакт", body: "Для зв'язку скористайтеся чат-ботом у правому нижньому куті сайту." },
    ],
  },
  auth: {
    title: "Вхід адміністратора",
    subtitle: "Тільки для персоналу",
    email: "Email",
    password: "Пароль",
    signIn: "Увійти",
    signUp: "Створити акаунт",
    switchToSignUp: "Немає акаунта? Зареєструватися",
    switchToSignIn: "Уже є акаунт? Увійти",
    signOut: "Вийти",
    notAdmin: "Ваш акаунт не має прав адміністратора.",
  },
  admin: {
    title: "Адмін-панель",
    totalLeads: "Всього звернень",
    last7: "Останні 7 днів",
    last30: "Останні 30 днів",
    byService: "За послугою",
    byLanguage: "За мовою",
    submissionsOverTime: "Надходження по днях",
    leadsTable: "Звернення",
    date: "Дата",
    name: "Ім'я",
    contact: "Контакт",
    service: "Послуга",
    language: "Мова",
    exportCsv: "Експорт CSV",
    newsManage: "Керування новинами",
    addNews: "Додати новину",
    slug: "Slug",
    titleField: "Заголовок",
    summary: "Опис",
    sourceUrl: "Посилання на джерело",
    publishedAt: "Дата публікації",
    published: "Опубліковано",
    save: "Зберегти",
    edit: "Редагувати",
    delete: "Видалити",
    cancel: "Скасувати",
  },
};

const EN: Dict = {
  htmlLang: "en",
  hreflang: "en",
  nav: { home: "Home", services: "Services", faq: "FAQ", news: "News", about: "About", admin: "Admin" },
  header: {
    openChat: "Open chat",
    theme: { light: "Light theme", dark: "Dark theme", system: "System theme", toggle: "Toggle theme" },
  },
  hero: {
    eyebrow: "Legalization in Poland",
    h1: `${SITE_NAME} — Poland residence, PR & citizenship without guesswork`,
    lead: "Temporary and permanent residence cards, Polish citizenship, work permits and CUKR.",
    ctaPrimary: "Ask the assistant",
    ctaSecondary: "Read the answers",
    bullets: [],
  },
  services: {
    heading: "What we cover",
    items: [
      { title: "Temporary residence card", body: "Deadlines, fees, document set, MOS portal and inPOL case tracking.", faqAnchor: "faq-0" },
      { title: "Permanent residence", body: "Grounds, required years, fees, and the Polish Card exemption.", faqAnchor: "faq-3" },
      { title: "Polish citizenship", body: "Recognition by the voivode or granting by the President, language and document requirements.", faqAnchor: "faq-5" },
      { title: "CUKR for Ukrainian citizens", body: "3-year permit, filed online in MOS until 4 March 2027.", faqAnchor: "faq-6" },
    ],
  },
  howItWorks: {
    heading: "How this site works",
    steps: [
      { title: "1. Pick a question", body: "Find your answer in the FAQ below or open the assistant in the bottom right corner." },
      { title: "2. Get the official source", body: "Every answer maps to gov.pl, MOS or inPOL — verify there before filing." },
      { title: "3. Need personal help", body: "Leave a contact in the assistant and receive email, phone and Telegram to a specialist." },
    ],
  },
  faq: {
    heading: "Frequently asked questions",
    lead: "Concise answers to the most common questions about legalization in Poland.",
    items: [
      { q: "How long does it take and how much does a temporary residence card cost?", a: "By law the decision is due within 60 days, counted from the last of these events: filing an application without formal defects (or remedying them), the in-person appointment, and submitting any documents requested. This time limit is suspended until 4 March 2027, so in practice it takes longer. The stamp duty for the permit is 440 PLN for the \"residence and work\" basis and the EU Blue Card, 340 PLN for most other grounds, and 170 PLN for seasonal work. On top of that, 100 PLN for the card itself (50 PLN for students, pupils and children under 16). In the Mazowieckie voivodeship you can track your case in the inPOL portal." },
      { q: "How do I submit a temporary or permanent residence application in 2026?", a: "Since 27 April 2026, applications for temporary residence, permanent residence and EU long-term resident status are filed exclusively online via the MOS portal. You create a MOS account after logging in through the state identification system (for example a Trusted Profile — Profil Zaufany); the account data include your PESEL number and e-mail. The voivode must help you set up the account. The confirmation that your application was filed is delivered through MOS." },
      { q: "What documents are needed for a temporary residence card?", a: "The basic package is: the application (submitted electronically via the MOS portal), a current digital photo, a valid passport, proof of payment of the stamp duty and the card fee, and documents specific to your purpose of stay (for example, for work — the employer's attachment and proof of health insurance). Fingerprints and a signature sample are not taken when you submit the application, but later, at an in-person appointment the voivode calls you to after filing (with at least 7 days' notice). If formal deficiencies are not remedied (including failing to appear for fingerprinting), the application is left unprocessed." },
      { q: "After how many years, and for what fee, can I get permanent residence?", a: "The main grounds (Act on Foreigners, art. 195 ust. 1): a valid Polish Card and intent to settle; Polish origin; children of Polish citizens or of a foreigner with permanent residence or EU resident status; spouses of Polish citizens — after at least 3 years of marriage and, at the same time, 2 years of uninterrupted residence on a temporary permit connected to the marriage; victims of human trafficking — under certain conditions, including 1 year on the relevant permit; 5 years of uninterrupted residence as a refugee, under subsidiary protection or humanitarian consent, or 10 years under tolerated stay; 4 years on a \"residence and work\" permit in an occupation needed by the Polish economy, with a stable income. The stamp duty is PLN 640 plus PLN 100 for the card; an application based on the Polish Card is exempt from the stamp duty. The permit itself is indefinite; the card is valid for 10 years and must then be replaced." },
      { q: "What is the EU long-term resident card, and how does it differ from permanent residence?", a: "It's a separate status: granted for an indefinite period once you have at least 5 years of continuous legal residence in Poland, a stable income, health insurance, and confirmed Polish language proficiency at B1 level or higher (this language requirement doesn't apply to children under 16). The card itself is issued for 5 years and must be renewed — unlike the 10-year permanent residence card. The stamp duty for the permit is PLN 640, plus PLN 100 for the card." },
      { q: "How, and after how many years, can I obtain Polish citizenship?", a: "There are two separate paths. 'Recognition as a citizen' is a voivode's decision issued when the conditions of the Citizenship Act (art. 30) are met. Most often: 3 years of uninterrupted residence on permanent residence (or EU resident status) with a stable income and legal title to housing; for spouses of Polish citizens — 2 years on permanent residence together with at least 3 years of marriage; 1 year on permanent residence obtained through Polish origin or the Polish Card. Polish at B1 level must be certified. The stamp duty is PLN 1000. 'Granting of citizenship' is a separate, discretionary decision of the President of Poland, with no deadlines or mandatory criteria and no appeal; the stamp duty is PLN 1669." },
      { q: "What is the CUKR residence card for Ukrainian citizens?", a: "The CUKR residence card confirms a 3-year temporary residence permit on special terms — for Ukrainian citizens with UKR status (temporary protection) who arrived in Poland after 23 February 2022, and certain family members. Conditions: UKR status held without interruption for at least 365 days, and a current PESEL UKR both on the day of filing and on the day the card is issued. Applications are filed only online in MOS, until 4 March 2027. The cost is PLN 340 plus PLN 100 for the card. The card gives full access to the labour market without a separate work permit. Dates can change — check gov.pl/UDSC closer to them." },
      { q: "Does a residence card allow me to work and travel in Schengen?", a: "A residence card together with a valid passport lets you stay in other Schengen countries for up to 90 days in any 180-day period. Whether you may work depends on the basis of the permit: if you may, the card carries the annotation \"dostęp do rynku pracy\" (access to the labour market). Permanent residence and CUKR give full labour-market access without a separate work permit." },
      { q: "Can I leave Poland during the procedure?", a: "The law does not forbid leaving, but the confirmation that you applied for temporary residence only certifies that your stay in Poland is legal — it is not an entry document. You can come back only on another basis (a visa, visa-free travel, etc.), so check with the voivode's office before you travel. If you are accumulating years towards permanent residence or citizenship, no single absence may exceed 6 months and all absences together 10 months. For people with UKR status, leaving Poland for more than 30 days in itself ends the temporary protection." },
      { q: "What can I do after a negative decision?", a: "You can appeal the voivode's decision to the Head of the Office for Foreigners within 14 days of delivery; the appeal is filed via the voivode. The Head of the Office has 90 days to decide. Until the decision becomes final — including during the appeal — your stay remains legal if the application was filed on time. The Head's decision can be challenged before the voivodeship administrative court within 30 days, but the court complaint itself does not legalise your stay. It is worth contacting a lawyer or a legal-aid organisation." }
    ],
  },
  news: {
    heading: "News & rule changes",
    lead: "Short updates with links to official sources.",
    readMore: "Read full article",
    seeAll: "All news",
    source: "Source",
    latest: "Latest news",
    empty: "No news yet.",
    back: "← Back to all news",
  },
  about: {
    heading: `About ${SITE_NAME}`,
    body: [
      `${SITE_NAME} is an information and consultation service that helps foreigners navigate legalization in Poland. We ground every answer in official sources — Urząd Wojewódzki, Ustawa o cudzoziemcach and Urząd do Spraw Cudzoziemców.`,
      "We explain the procedure in the user's language, with fees, deadlines and links. We are not a law firm — decisions in individual cases are taken by the voivode and the Head of the Office for Foreigners.",
    ],
    refs: "Official sources: gov.pl/web/udsc, mos.cudzoziemcy.gov.pl, inpol.mazowieckie.pl",
  },
  currencyNote: "Always verify on gov.pl.",
  footer: {
    tagline: "Legalization in Poland — clearly and up to date.",
    rights: `© 2026 ${SITE_NAME}. All rights reserved.`,
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    language: "Language",
  },
  chatbot: {
    title: SITE_NAME,
    subtitle: "Legalization assistant",
    disclaimer: "General information, not legal advice.",
    placeholder: "Type a question — e.g. 'how long for a residence card'",
    send: "Send",
    noMatch: "I couldn't find an exact answer. Try rephrasing, or leave your contact below and a specialist will help.",
    officialLinks: "Official resources:",
    linkApplication: "File the application — MOS",
    linkStatus: "Case status — inPOL",
    linkGeneral: "General information — gov.pl/UDSC",
    personalHelp: "I need personal help",
    endChat: "End chat",
    endChatConfirm: "Are you sure?",
    confirmYes: "Yes",
    confirmNo: "No",
    minimize: "Minimize",
    expand: "Expand",
    dragHint: "Move chat window",
    formHeading: "Leave your contact",
    formLead: "Share your contact and we will send the specialist's email, phone and Telegram.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    service: "Service",
    consent: "I consent to the processing of my personal data in line with the Privacy policy.",
    submit: "Send",
    submitting: "Sending...",
    revealTitle: "Thanks! Specialist contacts:",
    revealLead: "We will get back to you shortly. Meanwhile you can reach us directly:",
    telegram: "Open Telegram bot",
    close: "Close",
    reopen: "Open chat",
    backToChat: "Back to chat",
    services: ["Temporary residence", "Permanent residence", "Citizenship", "Work permit", "CUKR", "Other"],
    validationEmailOrPhone: "Provide an email or phone.",
    validationConsent: "Consent to data processing is required.",
    validationName: "Please enter your name.",
    thanks: "Thanks! We've received your request.",
    error: "Couldn't send. Please try again.",
  },
  meta: {
    homeTitle: `Poland residence & citizenship — ${SITE_NAME}`,
    homeDescription: "Up-to-date information about residence cards, permanent residence, Polish citizenship and CUKR — in three languages, with links to gov.pl, MOS and inPOL.",
    newsTitle: `Poland legalization news — ${SITE_NAME}`,
    newsDescription: "Updates on Polish legalization rule changes — MOS, inPOL, CUKR — with links to official sources.",
    privacyTitle: `Privacy policy — ${SITE_NAME}`,
    privacyDescription: `How ${SITE_NAME} collects and processes personal data under GDPR.`,
    termsTitle: `Terms of use — ${SITE_NAME}`,
    termsDescription: `Terms for using the ${SITE_NAME} website.`,
  },
  privacy: {
    heading: "Privacy policy",
    updated: `Updated: ${CURRENCY_DATE}`,
    dataController: `Data controller: ${SITE_NAME}.`,
    sections: [
      { h: "What data we collect", body: "Only what you voluntarily submit through the assistant's contact form: name, email or phone, selected service, language, and timestamp." },
      { h: "Purpose of processing", body: "To handle your request and provide information about legalization services. Processing is based on your consent (GDPR art. 6(1)(a))." },
      { h: "Retention", body: "Data is stored for no longer than 24 months from submission, or until you request deletion." },
      { h: "Your rights", body: "You have the right of access, rectification, erasure, restriction of processing and portability. Contact us through the assistant to exercise them." },
      { h: "Third parties", body: "We do not share your data with third parties without your consent, except where required by law." },
      { h: "Cookies and analytics", body: "The site does not use third-party analytics or marketing cookies." },
    ],
  },
  terms: {
    heading: "Terms of use",
    updated: `Updated: ${CURRENCY_DATE}`,
    sections: [
      { h: "General", body: `${SITE_NAME} content is informational and is not legal advice. Decisions in individual cases are made by the voivode and the Head of the Office for Foreigners.` },
      { h: "Timeliness", body: "We try to keep the information current, but always verify details on gov.pl and in the MOS portal." },
      { h: "Liability", body: "We are not responsible for decisions taken on the basis of information from this site without consulting a specialist." },
      { h: "Contact", body: "Contact us via the assistant in the bottom right corner." },
    ],
  },
  auth: {
    title: "Administrator sign-in",
    subtitle: "Staff only",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Create account",
    switchToSignUp: "No account? Create one",
    switchToSignIn: "Have an account? Sign in",
    signOut: "Sign out",
    notAdmin: "Your account does not have admin permissions.",
  },
  admin: {
    title: "Admin dashboard",
    totalLeads: "Total leads",
    last7: "Last 7 days",
    last30: "Last 30 days",
    byService: "By service",
    byLanguage: "By language",
    submissionsOverTime: "Submissions over time",
    leadsTable: "Leads",
    date: "Date",
    name: "Name",
    contact: "Contact",
    service: "Service",
    language: "Language",
    exportCsv: "Export CSV",
    newsManage: "Manage news",
    addNews: "Add news",
    slug: "Slug",
    titleField: "Title",
    summary: "Summary",
    sourceUrl: "Source URL",
    publishedAt: "Published at",
    published: "Published",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
  },
};

const PL: Dict = {
  htmlLang: "pl",
  hreflang: "pl",
  nav: { home: "Start", services: "Usługi", faq: "FAQ", news: "Aktualności", about: "O nas", admin: "Admin" },
  header: {
    openChat: "Otwórz czat",
    theme: { light: "Jasny motyw", dark: "Ciemny motyw", system: "Motyw systemowy", toggle: "Przełącz motyw" },
  },
  hero: {
    eyebrow: "Legalizacja w Polsce",
    h1: `${SITE_NAME} — legalizacja w Polsce bez zgadywania`,
    lead: "Karta pobytu, pobyt stały, obywatelstwo i zezwolenia na pracę.",
    ctaPrimary: "Zapytaj asystenta",
    ctaSecondary: "Przeczytaj odpowiedzi",
    bullets: [],
  },
  services: {
    heading: "Co obejmujemy",
    items: [
      { title: "Karta pobytu czasowego", body: "Terminy, opłaty, komplet dokumentów, portal MOS i śledzenie w inPOL.", faqAnchor: "faq-0" },
      { title: "Pobyt stały", body: "Podstawy, wymagane lata, opłaty i zwolnienia dla Karty Polaka.", faqAnchor: "faq-3" },
      { title: "Obywatelstwo polskie", body: "Uznanie przez wojewodę lub nadanie przez Prezydenta, wymagania językowe i dokumentacyjne.", faqAnchor: "faq-5" },
      { title: "CUKR dla obywateli Ukrainy", body: "Zezwolenie na 3 lata, wnioski w portalu MOS do 4 marca 2027.", faqAnchor: "faq-6" },
    ],
  },
  howItWorks: {
    heading: "Jak to działa",
    steps: [
      { title: "1. Wybierz pytanie", body: "Znajdź odpowiedź w FAQ poniżej lub otwórz asystenta w prawym dolnym rogu." },
      { title: "2. Sprawdź źródło", body: "Każda odpowiedź prowadzi do gov.pl, MOS lub inPOL." },
      { title: "3. Potrzebujesz kontaktu", body: "Zostaw kontakt w asystencie — otrzymasz e-mail, telefon i Telegram specjalisty." },
    ],
  },
  faq: {
    heading: "Najczęstsze pytania",
    lead: "Konkretne odpowiedzi na najczęstsze pytania o legalizację w Polsce.",
    items: [
      { q: "Ile czasu zajmuje i ile kosztuje karta pobytu czasowego?", a: "Ustawowy termin na decyzję to 60 dni, liczony od ostatniego z tych zdarzeń: złożenia wniosku bez braków formalnych (albo ich uzupełnienia), osobistego stawiennictwa, przedłożenia żądanych dokumentów. Do 4 marca 2027 bieg tego terminu jest zawieszony, więc w praktyce trwa to dłużej. Opłata skarbowa za zezwolenie: 440 zł za podstawę „pobyt i praca” oraz Niebieską Kartę UE, 340 zł za większość pozostałych podstaw, 170 zł za pracę sezonową. Osobno 100 zł za samą kartę (50 zł dla studentów, uczniów i dzieci do 16 roku życia). W województwie mazowieckim status sprawy można śledzić w portalu inPOL." },
      { q: "Jak złożyć wniosek o pobyt czasowy lub stały w 2026?", a: "Od 27 kwietnia 2026 wnioski o pobyt czasowy, stały i rezydenta długoterminowego UE składa się wyłącznie elektronicznie przez portal MOS. Konto w MOS zakłada się po zalogowaniu przez państwowy system identyfikacji (np. Profil Zaufany); wśród danych konta są numer PESEL i adres e-mail. Wojewoda ma obowiązek pomóc w założeniu konta. Zaświadczenie o złożeniu wniosku doręcza się przez MOS." },
      { q: "Jakie dokumenty są potrzebne do karty pobytu czasowego?", a: "Podstawowy komplet to: wniosek (elektronicznie, przez portal MOS), aktualne zdjęcie cyfrowe, ważny paszport, potwierdzenie opłaty skarbowej i opłaty za kartę pobytu oraz dokumenty właściwe dla celu pobytu (np. przy pracy — załącznik pracodawcy i potwierdzenie ubezpieczenia zdrowotnego). Odciski palców i wzór podpisu pobiera się nie przy składaniu wniosku, lecz podczas osobistego stawiennictwa, na które wojewoda wzywa już po złożeniu wniosku (z co najmniej 7-dniowym wyprzedzeniem). Jeśli nie uzupełnisz braków formalnych (w tym niestawienie się na pobranie odcisków), wniosek pozostanie bez rozpoznania." },
      { q: "Po ilu latach i za jaką opłatą można otrzymać pobyt stały?", a: "Główne podstawy (ustawa o cudzoziemcach, art. 195 ust. 1): ważna Karta Polaka i zamiar osiedlenia się; polskie pochodzenie; dzieci obywateli Polski albo cudzoziemca z pobytem stałym lub statusem rezydenta UE; małżonkowie obywateli Polski — po co najmniej 3 latach małżeństwa i jednocześnie 2 latach nieprzerwanego pobytu na zezwoleniu na pobyt czasowy związanym z małżeństwem; ofiary handlu ludźmi — na określonych warunkach, m.in. po roku na odpowiednim zezwoleniu; 5 lat nieprzerwanego pobytu jako uchodźca, z ochroną uzupełniającą lub zgodą humanitarną albo 10 lat pobytu tolerowanego; 4 lata na zezwoleniu na pobyt i pracę w zawodzie pożądanym dla polskiej gospodarki, przy stabilnym dochodzie. Opłata skarbowa wynosi 640 zł plus 100 zł za kartę; wniosek na podstawie Karty Polaka jest zwolniony z opłaty skarbowej. Samo zezwolenie jest bezterminowe, a karta jest ważna 10 lat i podlega wymianie." },
      { q: "Czym jest karta rezydenta długoterminowego UE i czym różni się od pobytu stałego?", a: "To odrębny status: udzielany na czas nieoznaczony, gdy spełnione są łącznie co najmniej 5 lat nieprzerwanego legalnego pobytu w Polsce, stabilny dochód, ubezpieczenie zdrowotne i potwierdzona znajomość języka polskiego na poziomie co najmniej B1 (wymóg językowy nie dotyczy dzieci poniżej 16 roku życia). Sama karta jest wydawana na 5 lat i podlega wymianie — w odróżnieniu od 10-letniej karty pobytu stałego. Opłata skarbowa za zezwolenie wynosi 640 zł, plus 100 zł za kartę." },
      { q: "Jak i po ilu latach można otrzymać obywatelstwo polskie?", a: "Istnieją dwie odrębne ścieżki. „Uznanie za obywatela” to decyzja wojewody wydawana po spełnieniu warunków ustawy o obywatelstwie polskim (art. 30). Najczęściej: 3 lata nieprzerwanego pobytu na pobycie stałym (albo statusie rezydenta UE) przy stabilnym dochodzie i tytule prawnym do mieszkania; dla małżonków obywateli Polski — 2 lata na pobycie stałym i jednocześnie co najmniej 3 lata małżeństwa; 1 rok na pobycie stałym uzyskanym z tytułu polskiego pochodzenia lub Karty Polaka. Wymagane jest urzędowe potwierdzenie znajomości języka polskiego na poziomie B1. Opłata skarbowa wynosi 1000 zł. „Nadanie obywatelstwa” to odrębna, uznaniowa decyzja Prezydenta RP, bez terminów i obowiązkowych kryteriów, od której nie przysługuje odwołanie; opłata skarbowa wynosi 1669 zł." },
      { q: "Czym jest karta pobytu CUKR dla obywateli Ukrainy?", a: "Karta pobytu CUKR potwierdza zezwolenie na pobyt czasowy na 3 lata, udzielane na szczególnych warunkach obywatelom Ukrainy ze statusem UKR (ochrona czasowa), którzy przyjechali do Polski po 23 lutego 2022, oraz niektórym członkom ich rodzin. Warunki: status UKR nieprzerwanie przez co najmniej 365 dni i aktualny PESEL UKR zarówno w dniu złożenia wniosku, jak i w dniu wydania karty. Wnioski składa się wyłącznie elektronicznie w MOS, do 4 marca 2027. Koszt to 340 zł plus 100 zł za kartę. Karta daje pełny dostęp do rynku pracy bez dodatkowego zezwolenia na pracę. Daty mogą się zmieniać — bliżej nich sprawdzaj gov.pl/UDSC." },
      { q: "Czy karta pobytu pozwala pracować i podróżować po Schengen?", a: "Karta pobytu wraz z ważnym paszportem uprawnia do pobytu w innych państwach Schengen do 90 dni w każdym okresie 180 dni. Prawo do pracy zależy od podstawy zezwolenia: jeśli przysługuje, karta ma adnotację „dostęp do rynku pracy”. Pobyt stały i CUKR dają pełny dostęp do rynku pracy bez dodatkowego zezwolenia na pracę." },
      { q: "Czy mogę wyjechać z Polski w trakcie procedury?", a: "Ustawa nie zakazuje wyjazdu, ale zaświadczenie o złożeniu wniosku o pobyt czasowy potwierdza tylko legalność pobytu w Polsce — nie jest dokumentem uprawniającym do wjazdu. Wrócić można jedynie na innej podstawie (wiza, ruch bezwizowy itp.), dlatego przed podróżą upewnij się w urzędzie wojewódzkim. Jeśli zbierasz lata do pobytu stałego lub obywatelstwa, pojedyncza przerwa nie może przekroczyć 6 miesięcy, a wszystkie łącznie — 10 miesięcy. Dla osób ze statusem UKR wyjazd z Polski na ponad 30 dni sam w sobie kończy ochronę czasową." },
      { q: "Co zrobić po decyzji odmownej?", a: "Od decyzji wojewody przysługuje odwołanie do Szefa Urzędu do Spraw Cudzoziemców w terminie 14 dni od doręczenia, składane za pośrednictwem wojewody. Szef Urzędu ma 90 dni na rozpatrzenie. Dopóki decyzja nie stanie się ostateczna — także w trakcie odwołania — pobyt pozostaje legalny, jeśli wniosek złożono w terminie. Decyzję Szefa Urzędu można zaskarżyć do wojewódzkiego sądu administracyjnego w terminie 30 dni, ale sama skarga do sądu nie legalizuje pobytu. Warto zwrócić się do adwokata lub organizacji pomocy prawnej." }
    ],
  },
  news: {
    heading: "Aktualności i zmiany przepisów",
    lead: "Krótkie aktualizacje z linkami do oficjalnych źródeł.",
    readMore: "Czytaj więcej",
    seeAll: "Wszystkie aktualności",
    source: "Źródło",
    latest: "Najnowsze",
    empty: "Brak aktualności.",
    back: "← Wróć do listy",
  },
  about: {
    heading: `O ${SITE_NAME}`,
    body: [
      `${SITE_NAME} to serwis informacyjno-konsultacyjny pomagający cudzoziemcom w legalizacji pobytu w Polsce. Opieramy się na oficjalnych źródłach — Urząd Wojewódzki, Ustawa o cudzoziemcach oraz Urząd do Spraw Cudzoziemców.`,
      "Wyjaśniamy procedurę w języku użytkownika, z opłatami, terminami i linkami. Nie jesteśmy kancelarią prawną — decyzje w indywidualnych sprawach podejmuje wojewoda i Szef Urzędu do Spraw Cudzoziemców.",
    ],
    refs: "Oficjalne źródła: gov.pl/web/udsc, mos.cudzoziemcy.gov.pl, inpol.mazowieckie.pl",
  },
  currencyNote: "Zawsze weryfikuj na gov.pl.",
  footer: {
    tagline: "Legalizacja w Polsce — jasno i aktualnie.",
    rights: `© 2026 ${SITE_NAME}. Wszelkie prawa zastrzeżone.`,
    legal: "Informacje prawne",
    privacy: "Polityka prywatności",
    terms: "Warunki użytkowania",
    language: "Język",
  },
  chatbot: {
    title: SITE_NAME,
    subtitle: "Asystent legalizacji",
    disclaimer: "Informacje ogólne, nie stanowią porady prawnej.",
    placeholder: "Wpisz pytanie — np. „ile czeka się na kartę pobytu”",
    send: "Wyślij",
    noMatch: "Nie znalazłem dokładnej odpowiedzi. Sformułuj pytanie inaczej lub zostaw kontakt poniżej — specjalista pomoże.",
    officialLinks: "Oficjalne zasoby:",
    linkApplication: "Złóż wniosek — MOS",
    linkStatus: "Status sprawy — inPOL",
    linkGeneral: "Informacje ogólne — gov.pl/UDSC",
    personalHelp: "Chcę pomocy osobistej",
    endChat: "Zakończ czat",
    endChatConfirm: "Czy na pewno?",
    confirmYes: "Tak",
    confirmNo: "Nie",
    minimize: "Zwiń",
    expand: "Rozwiń",
    dragHint: "Przenieś okno czatu",
    formHeading: "Zostaw kontakt",
    formLead: "Zostaw kontakt, a wyślemy Ci e-mail, telefon i Telegram specjalisty.",
    name: "Imię",
    email: "E-mail",
    phone: "Telefon",
    service: "Usługa",
    consent: "Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z Polityką prywatności.",
    submit: "Wyślij",
    submitting: "Wysyłam...",
    revealTitle: "Dziękujemy! Kontakt do specjalisty:",
    revealLead: "Odezwiemy się wkrótce. Możesz też napisać do nas od razu:",
    telegram: "Otwórz bot Telegram",
    close: "Zamknij",
    reopen: "Otwórz czat",
    backToChat: "Wróć do czatu",
    services: ["Karta pobytu czasowego", "Pobyt stały", "Obywatelstwo", "Zezwolenie na pracę", "CUKR", "Inne"],
    validationEmailOrPhone: "Podaj e-mail lub telefon.",
    validationConsent: "Wymagana jest zgoda na przetwarzanie danych.",
    validationName: "Podaj imię.",
    thanks: "Dziękujemy! Otrzymaliśmy Twoje zgłoszenie.",
    error: "Nie udało się wysłać. Spróbuj ponownie.",
  },
  meta: {
    homeTitle: `Legalizacja pobytu w Polsce — ${SITE_NAME}`,
    homeDescription: "Aktualne informacje o karcie pobytu, pobycie stałym, obywatelstwie polskim i CUKR — w trzech językach, z linkami do gov.pl, MOS i inPOL.",
    newsTitle: `Aktualności legalizacji w Polsce — ${SITE_NAME}`,
    newsDescription: "Aktualizacje o zmianach przepisów legalizacji w Polsce — MOS, inPOL, CUKR — z linkami do oficjalnych źródeł.",
    privacyTitle: `Polityka prywatności — ${SITE_NAME}`,
    privacyDescription: `Jak ${SITE_NAME} zbiera i przetwarza dane osobowe zgodnie z RODO.`,
    termsTitle: `Warunki użytkowania — ${SITE_NAME}`,
    termsDescription: `Warunki korzystania z serwisu ${SITE_NAME}.`,
  },
  privacy: {
    heading: "Polityka prywatności",
    updated: `Aktualizacja: ${CURRENCY_DATE}`,
    dataController: `Administrator danych: ${SITE_NAME}.`,
    sections: [
      { h: "Jakie dane zbieramy", body: "Tylko te, które dobrowolnie przekażesz przez formularz kontaktowy w asystencie: imię, e-mail lub telefon, wybrana usługa, język, data i godzina wysłania." },
      { h: "Cel przetwarzania", body: "Obsługa zgłoszeń i udostępnianie informacji o usługach legalizacji. Przetwarzanie opiera się na Twojej zgodzie (RODO art. 6 ust. 1 lit. a)." },
      { h: "Okres przechowywania", body: "Dane przechowujemy nie dłużej niż 24 miesiące od wysłania lub do momentu Twojego żądania usunięcia." },
      { h: "Twoje prawa", body: "Masz prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania i przenoszenia danych. Skorzystaj z nich przez asystenta." },
      { h: "Podmioty trzecie", body: "Nie udostępniamy danych podmiotom trzecim bez Twojej zgody, poza przypadkami wymaganymi prawem." },
      { h: "Cookies i analityka", body: "Serwis nie używa zewnętrznych skryptów analitycznych ani ciasteczek marketingowych." },
    ],
  },
  terms: {
    heading: "Warunki użytkowania",
    updated: `Aktualizacja: ${CURRENCY_DATE}`,
    sections: [
      { h: "Informacje ogólne", body: `Materiały serwisu ${SITE_NAME} mają charakter wyłącznie informacyjny i nie stanowią porady prawnej. Decyzje w konkretnych sprawach podejmuje wojewoda i Szef Urzędu do Spraw Cudzoziemców.` },
      { h: "Aktualność", body: "Staramy się utrzymywać informacje aktualne, ale zawsze weryfikuj szczegóły na gov.pl i w portalu MOS." },
      { h: "Odpowiedzialność", body: "Nie ponosimy odpowiedzialności za decyzje podjęte na podstawie informacji z tego serwisu bez konsultacji ze specjalistą." },
      { h: "Kontakt", body: "Skontaktuj się przez asystenta w prawym dolnym rogu serwisu." },
    ],
  },
  auth: {
    title: "Logowanie administratora",
    subtitle: "Tylko dla personelu",
    email: "E-mail",
    password: "Hasło",
    signIn: "Zaloguj",
    signUp: "Utwórz konto",
    switchToSignUp: "Nie masz konta? Zarejestruj się",
    switchToSignIn: "Masz konto? Zaloguj",
    signOut: "Wyloguj",
    notAdmin: "Twoje konto nie ma uprawnień administratora.",
  },
  admin: {
    title: "Panel administratora",
    totalLeads: "Wszystkie zgłoszenia",
    last7: "Ostatnie 7 dni",
    last30: "Ostatnie 30 dni",
    byService: "Wg usługi",
    byLanguage: "Wg języka",
    submissionsOverTime: "Zgłoszenia w czasie",
    leadsTable: "Zgłoszenia",
    date: "Data",
    name: "Imię",
    contact: "Kontakt",
    service: "Usługa",
    language: "Język",
    exportCsv: "Eksport CSV",
    newsManage: "Zarządzaj aktualnościami",
    addNews: "Dodaj aktualność",
    slug: "Slug",
    titleField: "Tytuł",
    summary: "Opis",
    sourceUrl: "URL źródła",
    publishedAt: "Data publikacji",
    published: "Opublikowane",
    save: "Zapisz",
    edit: "Edytuj",
    delete: "Usuń",
    cancel: "Anuluj",
  },
};

export const DICTS: Record<Locale, Dict> = { uk: UA, en: EN, pl: PL };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}
