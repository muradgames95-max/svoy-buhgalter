import Link from 'next/link'
import {
  MessageCircle,
  TrendingUp,
  FileText,
  Bell,
  ShieldCheck,
  ArrowRight,
  Check,
  ChevronRight,
  Zap,
  Star,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'AI-консультант',
    desc: 'Задайте любой вопрос о налогах на русском языке. Знает все изменения 2026 года — НПД, УСН, ОСНО, патент.',
    color: 'bg-indigo-50 text-indigo-600',
    border: 'hover:border-indigo-200',
  },
  {
    icon: TrendingUp,
    title: 'Трекер доходов',
    desc: 'Записывайте доходы, налог считается автоматически. Следит за лимитом НПД и предупредит до его достижения.',
    color: 'bg-emerald-50 text-emerald-600',
    border: 'hover:border-emerald-200',
  },
  {
    icon: FileText,
    title: 'Генератор документов',
    desc: 'Договор, акт, счёт — за 30 секунд. Шаблоны адаптированы под НПД, ИП и ООО.',
    color: 'bg-violet-50 text-violet-600',
    border: 'hover:border-violet-200',
  },
  {
    icon: Bell,
    title: 'Дедлайн-трекер',
    desc: 'Все сроки уплаты налогов в одном месте. Пуш-уведомления за 7, 3 и 1 день до дедлайна.',
    color: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-200',
  },
  {
    icon: ShieldCheck,
    title: 'Защита от штрафов',
    desc: 'Проверяет ваши договоры на риск переквалификации в трудовые отношения. Знает типичные ошибки, которые ловит ФНС.',
    color: 'bg-rose-50 text-rose-600',
    border: 'hover:border-rose-200',
  },
  {
    icon: Zap,
    title: 'Оптимизация режима',
    desc: 'Каждый квартал показывает — не переплачиваете ли вы. Конкретный план перехода на более выгодный режим.',
    color: 'bg-sky-50 text-sky-600',
    border: 'hover:border-sky-200',
  },
]

const PRICING = [
  {
    name: 'Бесплатно',
    price: '0',
    period: '',
    desc: 'Попробуйте без риска',
    features: ['3 вопроса AI-консультанту в месяц', 'Базовый трекер доходов', 'Дедлайн-календарь'],
    cta: 'Начать бесплатно',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Самозанятый',
    price: '299',
    period: '/мес',
    desc: 'Для физлиц на НПД',
    features: [
      'Неограниченные вопросы AI',
      'Трекер доходов и налогов',
      'Генератор документов',
      'Пуш-уведомления о дедлайнах',
      'Оптимизация режима',
    ],
    cta: 'Начать 7 дней бесплатно',
    href: '/pricing',
    highlight: true,
  },
  {
    name: 'ИП / ООО',
    price: '799',
    period: '/мес',
    desc: 'Для предпринимателей',
    features: [
      'Всё из тарифа «Самозанятый»',
      'УСН, ОСНО, патент',
      'Несколько режимов / юрлиц',
      'Проверка договоров на риски',
      'Приоритетная поддержка',
    ],
    cta: 'Начать 7 дней бесплатно',
    href: '/pricing',
    highlight: false,
  },
]

const FAQS = [
  {
    q: 'Нужно ли мне платить НДС в 2026 году как самозанятому?',
    a: 'Нет. Самозанятые на НПД освобождены от НДС независимо от оборота. НДС касается только ИП и ООО, чья выручка превысила 20 млн рублей в год (после снижения лимита в 2026 году).',
  },
  {
    q: 'Что изменилось для ИП в 2026 году?',
    a: 'Главные изменения: НДС вырос с 20% до 22%, лимит освобождения от НДС снизился с 60 до 20 млн руб./год, введена прогрессивная шкала НДФЛ (13–22%). Разобраться в деталях поможет наш AI-консультант.',
  },
  {
    q: 'Чем этот сервис лучше приложения «Мой налог»?',
    a: '«Мой налог» — только формирует чеки. Наш сервис объясняет что делать, предупреждает о рисках, оптимизирует налоговую нагрузку и отвечает на любые вопросы — как личный бухгалтер за 299 руб./мес.',
  },
]

function ProductPreview() {
  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-3xl scale-95" />

      <div className="relative bg-gray-950 rounded-3xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
        {/* Mini dashboard hero */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 px-5 pt-5 pb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 text-[11px] font-medium">пятница, 30 мая</span>
          </div>
          <p className="text-white text-base font-bold mb-3.5">Добрый день, Мурад</p>
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <div className="bg-white/8 rounded-2xl px-3.5 py-2.5 border border-white/5">
              <p className="text-gray-400 text-[10px] mb-1">В мае</p>
              <p className="text-white font-bold text-base leading-none">125 000 ₽</p>
              <p className="text-indigo-300 text-[10px] mt-1">82% от цели ✓</p>
            </div>
            <div className="bg-white/8 rounded-2xl px-3.5 py-2.5 border border-white/5">
              <p className="text-gray-400 text-[10px] mb-1">Чистая прибыль</p>
              <p className="text-emerald-400 font-bold text-base leading-none">98 400 ₽</p>
              <p className="text-emerald-400 text-[10px] mt-1">↑ +23% к апрелю</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-gray-400">Лимит НПД 2026</span>
              <span className="text-indigo-300 font-bold">5.2% · ост. 2,27 млн</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[5.2%] bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Chat preview */}
        <div className="px-4 py-4 space-y-2.5 bg-gray-900/60">
          <div className="bg-gray-800 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
            <p className="text-gray-300 text-[11px] leading-relaxed">Нужно ли мне платить НДС при обороте 5 млн?</p>
          </div>
          <div className="bg-indigo-600 rounded-xl rounded-tr-sm px-3.5 py-2.5 ml-auto max-w-[88%]">
            <p className="text-white text-[11px] leading-relaxed">
              Нет! Самозанятые на НПД освобождены от НДС при любом обороте по закону 422-ФЗ. Ваш лимит — только 2,4 млн/год дохода.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-7 bg-gray-800 rounded-full px-3 flex items-center">
              <span className="text-gray-500 text-[10px]">Задайте вопрос...</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HOW_IT_WORKS = [
  {
    num: '1',
    icon: MessageCircle,
    color: 'bg-indigo-600',
    title: 'Задайте вопрос',
    desc: 'Спросите AI-консультанта о налогах, льготах, рисках. Отвечает на русском за 10 секунд — бесплатно, без регистрации.',
  },
  {
    num: '2',
    icon: TrendingUp,
    color: 'bg-emerald-600',
    title: 'Ведите учёт',
    desc: 'Добавляйте доходы — налог считается автоматически. Создавайте документы, следите за лимитом НПД.',
  },
  {
    num: '3',
    icon: Bell,
    color: 'bg-amber-600',
    title: 'Не пропускайте сроки',
    desc: 'Все дедлайны в одном месте. Пуш-уведомления за 7, 3 и 1 день до каждого срока.',
  },
]

const ONLY_US = [
  {
    emoji: '🏥',
    tag: 'Новинка 2026',
    title: 'Калькулятор больничного',
    desc: 'С 2026 года самозанятые могут застраховаться в СФР. Мы первые, кто сделал калькулятор — выгодно ли вам подключаться.',
  },
  {
    emoji: '📅',
    tag: 'Авто-напоминание',
    title: 'Письмо об уплате НПД',
    desc: '23-го числа присылаем письмо с расчётной суммой налога за прошлый месяц. Успеете оплатить до 28-го — без пени.',
  },
  {
    emoji: '🤖',
    tag: 'Актуально',
    title: 'AI знает закон 2026',
    desc: 'НДС 22%, прогрессивный НДФЛ 13–22%, новые лимиты. Точные ответы по реформе — в отличие от обычного ChatGPT с устаревшей базой.',
  },
  {
    emoji: '📄',
    tag: 'Быстро',
    title: 'Счёт клиенту за 1 мин',
    desc: 'Профессиональный PDF со всеми реквизитами. Отправьте клиенту ссылку — без Word, без почты, прямо из телефона.',
  },
]

type CVal = true | false | 'partial'

interface CRow { label: string; us: CVal; moi: CVal; gpt: CVal; elba: CVal }

const COMPARISON_ROWS: CRow[] = [
  { label: 'AI-консультант по налогам РФ',   us: true,  moi: false,     gpt: 'partial', elba: false     },
  { label: 'Трекер доходов и расходов',       us: true,  moi: false,     gpt: false,     elba: true      },
  { label: 'Счета, договоры, акты — PDF',     us: true,  moi: false,     gpt: false,     elba: true      },
  { label: 'Дедлайны и email-уведомления',    us: true,  moi: false,     gpt: false,     elba: 'partial' },
  { label: 'Напоминание об уплате НПД',       us: true,  moi: false,     gpt: false,     elba: false     },
  { label: 'Калькулятор больничного 2026',    us: true,  moi: false,     gpt: false,     elba: false     },
  { label: 'Оптимизация налогового режима',   us: true,  moi: false,     gpt: 'partial', elba: 'partial' },
  { label: 'Без привязки к банку',            us: true,  moi: true,      gpt: true,      elba: true      },
]

function CellIcon({ v }: { v: CVal }) {
  if (v === true) return <span className="text-emerald-500 text-lg font-black leading-none">✓</span>
  if (v === 'partial') return <span className="text-amber-500 text-xs font-semibold">частично</span>
  return <span className="text-gray-300 text-lg leading-none">✗</span>
}

const REVIEWS = [
  { name: 'Анна С.', role: 'Дизайнер, НПД', text: 'Наконец-то понятно объяснили про НДС и мой лимит. Раньше боялась ошибиться.', stars: 5 },
  { name: 'Дмитрий К.', role: 'Разработчик, ИП УСН', text: 'Прогноз налога на год — это огонь. Теперь знаю сколько откладывать.', stars: 5 },
  { name: 'Мария Л.', role: 'Копирайтер, НПД', text: 'Создала договор за 2 минуты. Раньше тратила час в ворде и всё равно не была уверена.', stars: 5 },
]

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-300">
              <span className="text-white text-xs font-bold">СБ</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Свой Бухгалтер</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Войти
            </Link>
            <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-indigo-200">
              Начать бесплатно
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(99,102,241,0.10),transparent)]" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row lg:items-center gap-14 lg:gap-10">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                15,27 млн самозанятых в России
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
                Личный бухгалтер
                <br />
                <span className="text-indigo-600">на базе AI</span>
              </h1>

              <p className="text-xl text-gray-500 max-w-xl mb-10 lg:mx-0 mx-auto">
                НПД, УСН и все изменения 2026 года. Считает налоги, предупреждает о штрафах, отвечает на вопросы — за ₽299/мес вместо ₽8 000 у бухгалтера.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-lg shadow-lg shadow-indigo-200"
                >
                  Задать вопрос бесплатно
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-2xl transition-all text-lg"
                >
                  <TrendingUp className="w-5 h-5" />
                  Начать бесплатно
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />Без регистрации
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />Ответ за 10 секунд
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />Реформа 2026 года
                </span>
              </div>
            </div>

            {/* Right: product mockup */}
            <div className="lg:w-80 xl:w-96 shrink-0 w-full max-w-sm mx-auto lg:mx-0">
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-gray-950 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest mb-10">
            Узнаёте себя?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { text: '«НДС повысили до 22%... а мне надо платить?»', emoji: '😰' },
              { text: '«Когда платить аванс по УСН и сколько?»', emoji: '🤯' },
              { text: '«Выгоднее УСН или патент при моей выручке?»', emoji: '🤔' },
            ].map(({ text, emoji }) => (
              <div key={text} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                <span className="text-2xl mb-3 block">{emoji}</span>
                <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-indigo-400 font-semibold mt-8 text-lg">
            Свой Бухгалтер отвечает на эти вопросы за 10 секунд
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Как это работает</h2>
            <p className="text-gray-500 text-lg">Три шага до финансового порядка</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-7 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {HOW_IT_WORKS.map(({ num, icon: Icon, color, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-black text-gray-700 shadow-sm">
                    {num}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Всё что нужно — в одном месте</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Не просто отвечает на вопросы. Следит за вашими финансами, предупреждает о рисках и
              экономит деньги.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, border }) => (
              <div
                key={title}
                className={`bg-white border border-gray-100 ${border} rounded-2xl p-6 transition-all hover:shadow-md`}
              >
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: '15,27 млн', label: 'самозанятых в России нуждаются в помощи' },
              { value: '₽299/мес', label: 'вместо ₽8 000+ у штатного бухгалтера' },
              { value: '10 сек', label: 'среднее время ответа на налоговый вопрос' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold mb-2">{value}</div>
                <div className="text-indigo-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Only us */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Только в Своём Бухгалтере</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Фичи, которых нет у конкурентов</h2>
            <p className="text-gray-400 max-w-lg mx-auto">Мы не просто скопировали рынок — добавили то, чего не хватало самозанятым.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ONLY_US.map(({ emoji, tag, title, desc }) => (
              <div key={title} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-indigo-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full whitespace-nowrap">{tag}</span>
                </div>
                <h3 className="font-bold text-white text-sm leading-snug mb-2">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-3">Сравнение</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Один сервис вместо нескольких</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Конкуренты закрывают одну задачу. Свой Бухгалтер — весь финансовый учёт самозанятого.</p>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[580px] text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-4 pr-6 w-[38%]" />
                  <th className="pb-4 px-3 text-center">
                    <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3 shadow-lg shadow-indigo-200">
                      <p className="font-bold text-sm">Свой Бухгалтер</p>
                      <p className="text-indigo-200 text-xs mt-0.5">₽299/мес</p>
                    </div>
                  </th>
                  <th className="pb-4 px-3 text-center">
                    <div className="rounded-2xl px-4 py-3 border border-gray-100 bg-gray-50">
                      <p className="font-semibold text-gray-700 text-xs">Мой налог</p>
                      <p className="text-gray-400 text-xs mt-0.5">Бесплатно</p>
                    </div>
                  </th>
                  <th className="pb-4 px-3 text-center">
                    <div className="rounded-2xl px-4 py-3 border border-gray-100 bg-gray-50">
                      <p className="font-semibold text-gray-700 text-xs">ChatGPT</p>
                      <p className="text-gray-400 text-xs mt-0.5">~₽1 900/мес</p>
                    </div>
                  </th>
                  <th className="pb-4 px-3 text-center">
                    <div className="rounded-2xl px-4 py-3 border border-gray-100 bg-gray-50">
                      <p className="font-semibold text-gray-700 text-xs">Контур.Эльба</p>
                      <p className="text-gray-400 text-xs mt-0.5">от ₽2 190/мес</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(({ label, us, moi, gpt, elba }) => (
                  <tr key={label} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pr-6 text-gray-600 text-sm font-medium">{label}</td>
                    <td className="py-3.5 px-3 text-center bg-indigo-50/40">
                      <CellIcon v={us} />
                    </td>
                    <td className="py-3.5 px-3 text-center"><CellIcon v={moi} /></td>
                    <td className="py-3.5 px-3 text-center"><CellIcon v={gpt} /></td>
                    <td className="py-3.5 px-3 text-center"><CellIcon v={elba} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-400 text-xs mt-6">
            Данные актуальны на май 2026 г. &nbsp;«частично» — функция реализована ограниченно.
          </p>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Что говорят пользователи</h2>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-gray-500 text-sm ml-2">4.9 / 5 — средняя оценка</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {REVIEWS.map(({ name, role, text, stars }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{`«${text}»`}</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Простые цены</h2>
            <p className="text-gray-500 text-lg">Первые 7 дней бесплатно на любом платном тарифе</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {PRICING.map(({ name, price, period, desc, features, cta, href, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-6 flex flex-col ${
                  highlight
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 sm:scale-[1.02] shadow-xl shadow-indigo-200'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="mb-6">
                  <p className={`text-sm font-medium mb-1 ${highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">₽{price}</span>
                    <span className={`text-sm ${highlight ? 'text-indigo-200' : 'text-gray-400'}`}>{period}</span>
                  </div>
                  <p className={`text-sm mt-1 ${highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-indigo-200' : 'text-emerald-500'}`} />
                      <span className={highlight ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    highlight
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Частые вопросы</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Задайте первый вопрос прямо сейчас</h2>
          <p className="text-gray-400 mb-8 text-lg">Бесплатно. Без регистрации. Ответ за 10 секунд.</p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] text-lg shadow-lg shadow-indigo-900"
          >
            Открыть консультант
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">СБ</span>
            </div>
            <span className="text-gray-400 text-sm">Свой Бухгалтер</span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            Не является юридической или налоговой консультацией. Для сложных случаев обращайтесь к сертифицированному бухгалтеру.
          </p>
        </div>
      </footer>
    </main>
  )
}
