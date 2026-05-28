'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Zap, Shield, Crown, Loader2, AlertCircle, CheckCircle2, MessageCircle, FileText } from 'lucide-react'
import { cn, formatRubles } from '@/lib/utils'

const PLANS = [
  {
    id: 'free',
    name: 'Бесплатно',
    icon: Zap,
    price: 0,
    gradient: 'from-gray-600 to-gray-700',
    features: [
      '3 вопроса AI-консультанту в месяц',
      'Базовый трекер доходов',
      'Налоговый календарь',
      '1 документ в месяц',
    ],
    missing: [
      'Неограниченные вопросы AI',
      'Оптимизация режима',
      'Проверка договоров',
    ],
    cta: 'Текущий тариф',
    highlight: false,
  },
  {
    id: 'self',
    name: 'Самозанятый',
    icon: Shield,
    price: 299,
    gradient: 'from-indigo-600 to-violet-600',
    features: [
      'Неограниченные вопросы AI',
      'Трекер доходов + расчёт налогов',
      'Генератор документов (без лимита)',
      'Пуш-уведомления о дедлайнах',
      'Оптимизация налогового режима',
      'Анализ договоров на риски',
    ],
    missing: [],
    cta: 'Начать 7 дней бесплатно',
    highlight: true,
  },
  {
    id: 'ip',
    name: 'ИП / ООО',
    icon: Crown,
    price: 799,
    gradient: 'from-violet-600 to-purple-700',
    features: [
      'Всё из тарифа «Самозанятый»',
      'Поддержка УСН, ОСНО, патента',
      'Несколько режимов и юрлиц',
      'Расчёт страховых взносов',
      'Подготовка к декларации',
      'Приоритетная поддержка',
    ],
    missing: [],
    cta: 'Начать 7 дней бесплатно',
    highlight: false,
  },
]

const FAQ = [
  {
    q: 'Как работает пробный период?',
    a: '7 дней полного доступа без списания. Отменить можно в любой момент.',
  },
  {
    q: 'Какие способы оплаты доступны?',
    a: 'Карты Visa, MasterCard, МИР, СБП, Тинькофф Pay, ЮКасса.',
  },
  {
    q: 'Можно ли сменить тариф?',
    a: 'Да, в любое время. При переходе вверх — доплата пропорционально остатку периода.',
  },
  {
    q: 'Данные защищены?',
    a: 'Все данные хранятся на серверах в России. Передача — по шифрованному каналу TLS 1.3.',
  },
]

export default function PricingPageContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [notice, setNotice] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [planExpires, setPlanExpires] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ chatCount: number; docCount: number } | null>(null)
  const [limits, setLimits] = useState<{ aiQuestions: number | null; documents: number | null } | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === '1'

  useEffect(() => {
    fetch('/api/subscription')
      .then((r) => r.json())
      .then((d: { plan: string; expiresAt: string | null; usage: typeof usage; limits: typeof limits }) => {
        setCurrentPlan(d.plan)
        if (d.expiresAt) setPlanExpires(new Date(d.expiresAt).toLocaleDateString('ru-RU'))
        if (d.usage) setUsage(d.usage)
        if (d.limits) setLimits(d.limits)
      })
      .catch(() => null)
  }, [])

  async function handleSubscribe(planId: string) {
    if (planId === 'free') return
    setLoading(planId)
    setNotice(null)

    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, period }),
    })
    const data = await res.json() as { url?: string; error?: string }

    if (data.url) {
      window.location.href = data.url
      return
    }

    setLoading(null)
    if (data.error === 'yookassa_not_configured') {
      setNotice('Для приёма оплаты добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local')
    } else {
      setNotice('Ошибка создания платежа. Попробуйте позже.')
    }
  }

  const discount = period === 'yearly' ? 0.8 : 1

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-start gap-3 px-4 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold">Оплата прошла успешно!</p>
            <p className="text-emerald-700 mt-0.5">Ваш тариф активирован. Спасибо за доверие.</p>
          </div>
        </div>
      )}
      {currentPlan !== 'free' && planExpires && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-sm text-indigo-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>Активный тариф до <strong>{planExpires}</strong></span>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>{notice}</span>
        </div>
      )}
      {/* Usage for free plan */}
      {currentPlan === 'free' && usage && limits && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Использование в этом месяце</p>
          {limits.aiQuestions != null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-800">AI-вопросы</span>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  usage.chatCount >= limits.aiQuestions ? 'text-red-600' : 'text-gray-700'
                )}>
                  {usage.chatCount} / {limits.aiQuestions}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    usage.chatCount >= limits.aiQuestions ? 'bg-red-500' : 'bg-indigo-500'
                  )}
                  style={{ width: `${Math.min((usage.chatCount / limits.aiQuestions) * 100, 100)}%` }}
                />
              </div>
              {usage.chatCount >= limits.aiQuestions && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">Лимит исчерпан — обновляется 1-го числа каждого месяца</p>
              )}
            </div>
          )}
          {limits.documents != null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold text-gray-800">Документы</span>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  usage.docCount >= limits.documents ? 'text-red-600' : 'text-gray-700'
                )}>
                  {usage.docCount} / {limits.documents}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    usage.docCount >= limits.documents ? 'bg-red-500' : 'bg-violet-500'
                  )}
                  style={{ width: `${Math.min((usage.docCount / limits.documents) * 100, 100)}%` }}
                />
              </div>
              {usage.docCount >= limits.documents && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">Лимит исчерпан — обновляется 1-го числа каждого месяца</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Period toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setPeriod('monthly')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              period === 'monthly' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Ежемесячно
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
              period === 'yearly' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Ежегодно
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">−20%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {PLANS.map(({ id, name, icon: Icon, price, gradient, features, missing, cta, highlight }) => {
          const active = id === currentPlan
          const finalPrice = Math.round(price * discount)
          return (
            <div
              key={id}
              className={cn(
                'rounded-3xl overflow-hidden flex flex-col',
                highlight ? 'shadow-2xl shadow-indigo-200 sm:scale-[1.03]' : 'bg-white border border-gray-100 shadow-sm'
              )}
            >
              {/* Card header */}
              <div className={cn('p-6 bg-gradient-to-br', gradient)}>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">{name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {price === 0 ? 'Бесплатно' : `₽${finalPrice}`}
                  </span>
                  {price > 0 && (
                    <span className="text-white/60 text-sm">
                      /мес
                      {period === 'yearly' && (
                        <span className="ml-1 line-through opacity-60">₽{price}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="p-5 flex flex-col flex-1 bg-white">
                <ul className="space-y-2.5 flex-1 mb-5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5 text-indigo-600" />
                      </div>
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                  {missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-35">
                      <span className="w-4 h-4 flex items-center justify-center mt-0.5 text-gray-400 text-xs shrink-0">—</span>
                      <span className="text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(id)}
                  disabled={active || loading === id}
                  className={cn(
                    'w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                    active
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : `bg-gradient-to-r ${gradient} text-white hover:opacity-90 shadow-sm`,
                    loading === id ? 'opacity-70 cursor-not-allowed' : ''
                  )}
                >
                  {loading === id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Перенаправление...</>
                  ) : cta}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment methods */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Способы оплаты</p>
        <div className="flex flex-wrap gap-2">
          {['МИР', 'Visa / MC', 'СБП', 'Tinkoff Pay', 'ЮКасса'].map((m) => (
            <span
              key={m}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold"
            >
              {m}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Платёжный провайдер — ЮКасса. Данные карты не хранятся на наших серверах.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Вопросы об оплате</p>
        {FAQ.map(({ q, a }) => (
          <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="font-bold text-gray-900 text-sm mb-1">{q}</p>
            <p className="text-gray-500 text-sm">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
