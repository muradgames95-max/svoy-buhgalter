'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, User, Briefcase, TrendingUp, Calculator, Sparkles } from 'lucide-react'
import { saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import { cn } from '@/lib/utils'

type Status = 'npd' | 'ip_usn' | 'ip_osno' | 'ip_patent' | 'planning'

const STATUSES = [
  { id: 'npd' as Status, label: 'Самозанятый (НПД)', desc: 'Плачу налог 4–6%', color: 'border-indigo-500 bg-indigo-50' },
  { id: 'ip_usn' as Status, label: 'ИП на УСН', desc: 'Упрощённая система', color: 'border-violet-500 bg-violet-50' },
  { id: 'ip_osno' as Status, label: 'ИП на ОСНО', desc: 'Общая система, плачу НДС', color: 'border-sky-500 bg-sky-50' },
  { id: 'ip_patent' as Status, label: 'ИП на патенте', desc: 'Фиксированная стоимость', color: 'border-emerald-500 bg-emerald-50' },
  { id: 'planning' as Status, label: 'Только планирую', desc: 'Ещё не зарегистрирован', color: 'border-amber-500 bg-amber-50' },
]

const ACTIVITIES = [
  'Разработка / IT', 'Дизайн', 'Маркетинг / SMM', 'Копирайтинг / контент',
  'Консультации', 'Репетиторство / образование', 'Красота / здоровье',
  'Строительство / ремонт', 'Транспорт / доставка', 'Торговля', 'Другое',
]

const INCOME_RANGES = [
  { id: 'lt300', label: 'до 300 000 ₽ / год', emoji: '🌱' },
  { id: '300_1m', label: '300 000 — 1 000 000 ₽', emoji: '📈' },
  { id: '1m_2_4m', label: '1 000 000 — 2 400 000 ₽', emoji: '🚀' },
  { id: 'gt2_4m', label: 'свыше 2 400 000 ₽', emoji: '💼' },
]

const STEP_TITLES = ['Давайте знакомиться', 'Ваш статус', 'Вид деятельности', 'Ваш доход', 'Готово!']
const STEP_DESCS  = [
  'Как вас зовут? Настроим приложение под вас',
  'Выберите ваш налоговый режим',
  'Подберём нужные шаблоны и советы',
  'Поможем выбрать оптимальный режим',
  'Приложение настроено под вас',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status | null>(null)
  const [activity, setActivity] = useState('')
  const [incomeRange, setIncomeRange] = useState('')

  function finish() {
    const statusLabel = STATUSES.find((s) => s.id === status)?.label ?? ''
    saveToStorage(STORAGE_KEYS.PROFILE, { name: name.trim(), executorStatus: statusLabel, activity, incomeRange })
    saveToStorage(STORAGE_KEYS.ONBOARDING_DONE, true)
    router.push('/overview')
  }

  const canAdvance = [
    name.trim().length >= 2,
    status !== null,
    activity !== '',
    incomeRange !== '',
  ]

  const totalSteps = 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 pt-6 pb-7">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Свой Бухгалтер</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-1">{STEP_TITLES[step]}</h1>
          <p className="text-indigo-200 text-sm">{STEP_DESCS[step]}</p>
          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i < step ? 'w-6 h-2 bg-white' : i === step ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/25'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ваше имя</label>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canAdvance[0] && setStep(1)}
                  autoFocus
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              {name.trim() && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-sm text-indigo-700">
                  👋 Привет, <strong>{name.trim().split(' ')[0]}</strong>! Рады вас видеть.
                </div>
              )}
            </div>
          )}

          {/* Step 1: Status */}
          {step === 1 && (
            <div className="space-y-2">
              {STATUSES.map(({ id, label, desc, color }) => (
                <button
                  key={id}
                  onClick={() => setStatus(id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
                    status === id ? color : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    status === id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  )}>
                    {status === id && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className={cn('font-semibold text-sm', status === id ? 'text-gray-900' : 'text-gray-800')}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Activity */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a}
                  onClick={() => setActivity(a)}
                  className={cn(
                    'p-3.5 rounded-2xl border-2 text-sm font-medium text-left transition-all',
                    activity === a
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Income */}
          {step === 3 && (
            <div className="space-y-2.5">
              {INCOME_RANGES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setIncomeRange(id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                    incomeRange === id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <span className={cn('font-semibold text-sm', incomeRange === id ? 'text-indigo-700' : 'text-gray-900')}>
                      {label}
                    </span>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    incomeRange === id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  )}>
                    {incomeRange === id && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="space-y-3">
              {[
                { icon: User, text: name.trim(), label: 'Имя', color: 'bg-indigo-50 text-indigo-600' },
                { icon: Briefcase, text: STATUSES.find((s) => s.id === status)?.label ?? '', label: 'Статус', color: 'bg-violet-50 text-violet-600' },
                { icon: Calculator, text: activity, label: 'Деятельность', color: 'bg-emerald-50 text-emerald-600' },
                { icon: TrendingUp, text: INCOME_RANGES.find((r) => r.id === incomeRange)?.label ?? '', label: 'Доход', color: 'bg-amber-50 text-amber-600' },
              ].map(({ icon: Icon, text, label, color }) => (
                <div key={label} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 mt-6">
            {step > 0 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-3.5 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance[step]}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
              >
                Далее <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                disabled={!canAdvance[3]}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
              >
                Завершить настройку <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 4 && (
              <button
                onClick={finish}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200"
              >
                Открыть приложение <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
