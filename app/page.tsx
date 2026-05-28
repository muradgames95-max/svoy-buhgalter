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
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'AI-консультант',
    desc: 'Задайте любой вопрос о налогах на русском языке. Знает все изменения 2026 года — НПД, УСН, ОСНО, патент.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: TrendingUp,
    title: 'Трекер доходов',
    desc: 'Записывайте доходы, налог считается автоматически. Следит за лимитом НПД и предупредит до его достижения.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: FileText,
    title: 'Генератор документов',
    desc: 'Договор, акт, счёт — за 30 секунд. Шаблоны адаптированы под НПД, ИП и ООО.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Bell,
    title: 'Дедлайн-трекер',
    desc: 'Все сроки уплаты налогов в одном месте. Пуш-уведомления за 7, 3 и 1 день до дедлайна.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: 'Защита от штрафов',
    desc: 'Проверяет ваши договоры на риск переквалификации в трудовые отношения. Знает типичные ошибки, которые ловит ФНС.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Zap,
    title: 'Оптимизация режима',
    desc: 'Каждый квартал показывает — не переплачиваете ли вы. Конкретный план перехода на более выгодный режим.',
    color: 'bg-sky-50 text-sky-600',
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
    href: '/chat',
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
    href: '/chat',
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
    href: '/chat',
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

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">СБ</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Свой Бухгалтер</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Доходы
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Спросить AI
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-20 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            15,27 млн самозанятых в России — для них и создан этот сервис
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6 animate-fade-up delay-100">
            Личный бухгалтер
            <br />
            <span className="text-indigo-600">на базе AI</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            Разбирается в НПД, УСН и всех изменениях 2026 года. Считает налоги, предупреждает о
            штрафах, отвечает на любые вопросы — за 299 руб/мес вместо 8 000 руб за бухгалтера.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
            >
              Задать вопрос бесплатно
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-2xl transition-all text-lg"
            >
              <TrendingUp className="w-5 h-5" />
              Трекер доходов
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4 animate-fade-up delay-400">
            Бесплатно · Без регистрации · Знает реформу 2026 года
          </p>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-gray-950 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest mb-10">
            Узнаёте себя?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { text: '«НДС повысили до 22%... а мне надо платить?»', emoji: '😰' },
              { text: '«Когда платить аванс по УСН и сколько?»', emoji: '🤯' },
              { text: '«Выгоднее УСН или патент при моей выручке?»', emoji: '🤔' },
            ].map(({ text, emoji }) => (
              <div key={text} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
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

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Всё что нужно — в одном месте</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Не просто отвечает на вопросы. Следит за вашими финансами, предупреждает о рисках и
              экономит деньги.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-2xl p-6 transition-all hover:shadow-md"
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

      {/* Pricing */}
      <section className="py-24 bg-white">
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
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 sm:scale-[1.02]'
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
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
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-indigo-200' : 'text-emerald-500'}`}
                      />
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Частые вопросы</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-200 p-6">
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] text-lg"
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
