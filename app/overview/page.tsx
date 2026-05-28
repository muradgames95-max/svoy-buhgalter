'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, MessageCircle, FileText, Calculator,
  Plus, ArrowRight, Wallet, CalendarClock, Sparkles, Target, Pencil, Check,
  ArrowUp, ArrowDown, Receipt, ShoppingBag, AlertCircle,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import NpdTaxSchedule from '@/components/tax/NpdTaxSchedule'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import { DEADLINES_2026, getDaysUntil } from '@/lib/deadlines'
import { calculateNPDTax, formatRubles } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Income { id: string; amount: number; isLegal: boolean; date: string; description: string; clientName?: string }
interface Expense { id: string; amount: number; category: string; date: string }
interface UserProfile { name?: string; executorStatus?: string; activity?: string }

const NPD_LIMIT = 2_400_000
const MONTH_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const MONTH_FULL  = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTH_SHORT[parseInt(m) - 1]}`
}

const QUICK_ACTIONS = [
  { href: '/dashboard', icon: Plus, label: 'Добавить доход', color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' },
  { href: '/chat', icon: MessageCircle, label: 'Спросить AI', color: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200' },
  { href: '/documents', icon: FileText, label: 'Новый документ', color: 'bg-sky-600 hover:bg-sky-700 shadow-sky-200' },
  { href: '/calculator', icon: Calculator, label: 'Калькулятор', color: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' },
]

export default function OverviewPage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [profile, setProfile] = useState<UserProfile>({})
  const [monthlyGoal, setMonthlyGoal] = useState(0)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, []))
    setExpenses(loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []))
    setProfile(loadFromStorage<UserProfile>(STORAGE_KEYS.PROFILE, {}))
    const g = loadFromStorage<number>(STORAGE_KEYS.MONTHLY_GOAL, 0)
    setMonthlyGoal(g)
    setGoalInput(g > 0 ? String(g) : '')
    setHydrated(true)
  }, [])

  function saveGoal() {
    const v = parseFloat(goalInput.replace(/\s/g, '').replace(',', '.'))
    const goal = isNaN(v) || v <= 0 ? 0 : v
    setMonthlyGoal(goal)
    saveToStorage(STORAGE_KEYS.MONTHLY_GOAL, goal)
    setEditingGoal(false)
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const yearIncomes  = useMemo(() => incomes.filter((i) => parseInt(i.date.split('-')[0]) === currentYear), [incomes, currentYear])
  const yearExpenses = useMemo(() => expenses.filter((e) => parseInt(e.date.split('-')[0]) === currentYear), [expenses, currentYear])

  const totalIncome  = useMemo(() => yearIncomes.reduce((s, i) => s + i.amount, 0), [yearIncomes])
  const totalTax     = useMemo(() => yearIncomes.reduce((s, i) => s + calculateNPDTax(i.amount, i.isLegal), 0), [yearIncomes])
  const totalExpenses = useMemo(() => yearExpenses.reduce((s, e) => s + e.amount, 0), [yearExpenses])

  const thisMonthIncome = useMemo(() =>
    yearIncomes.filter((i) => parseInt(i.date.split('-')[1]) === currentMonth).reduce((s, i) => s + i.amount, 0),
    [yearIncomes, currentMonth]
  )

  const usagePct = Math.min((totalIncome / NPD_LIMIT) * 100, 100)
  const remaining = NPD_LIMIT - totalIncome
  const goalPct = monthlyGoal > 0 ? Math.min((thisMonthIncome / monthlyGoal) * 100, 100) : 0
  const isNpd = !profile.executorStatus || profile.executorStatus.toLowerCase().includes('нпд') || profile.executorStatus.toLowerCase().includes('самозанят')

  const upcomingDeadlines = useMemo(() =>
    DEADLINES_2026
      .filter((d) => { const n = getDaysUntil(d.date); return n >= 0 && n <= 60 })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 2),
    []
  )

  const recentIncomes = useMemo(() =>
    [...yearIncomes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [yearIncomes]
  )

  // Smart insights
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const lastMonthIncome = useMemo(() =>
    incomes
      .filter((i) => {
        const [y, m] = i.date.split('-').map(Number)
        return y === lastMonthYear && m === lastMonth
      })
      .reduce((s, i) => s + i.amount, 0),
    [incomes, lastMonth, lastMonthYear]
  )

  const incomeMomentum = useMemo(() => {
    if (lastMonthIncome === 0) return null
    return ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
  }, [thisMonthIncome, lastMonthIncome])

  const thisMonthTax = useMemo(() =>
    yearIncomes
      .filter((i) => parseInt(i.date.split('-')[1]) === currentMonth)
      .reduce((s, i) => s + calculateNPDTax(i.amount, i.isLegal), 0),
    [yearIncomes, currentMonth]
  )

  const topExpenseCategory = useMemo(() => {
    const map: Record<string, number> = {}
    yearExpenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0] ?? null
  }, [expenses])

  const nextDeadline = useMemo(() =>
    DEADLINES_2026
      .map((d) => ({ ...d, days: getDaysUntil(d.date) }))
      .filter((d) => d.days >= 0)
      .sort((a, b) => a.days - b.days)[0] ?? null,
    []
  )

  const taxDueMonth = currentMonth === 12 ? 0 : currentMonth
  const taxDueLabel = `28 ${MONTH_SHORT[taxDueMonth]}`

  const firstName = profile.name ? profile.name.split(' ')[0] : null
  const todayStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })

  if (!hydrated) return <AppShell><div className="min-h-screen bg-gray-50" /></AppShell>

  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 pb-16 space-y-5">

          {/* Hero */}
          <div className="relative rounded-b-3xl overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 px-6 pt-8 pb-7 -mx-4">
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-indigo-600/10" />
            <div className="absolute -bottom-10 left-0 w-48 h-48 rounded-full bg-violet-600/8" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-indigo-300 text-xs font-medium capitalize">{todayStr}</p>
              </div>
              <h1 className="text-white text-2xl font-bold mb-5">
                {getGreeting()}{firstName ? `, ${firstName}` : ''}
              </h1>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white/8 rounded-2xl px-4 py-3.5 border border-white/5">
                  <p className="text-gray-400 text-[11px] mb-1">В {MONTH_FULL[currentMonth - 1]}</p>
                  <p className="text-white font-bold text-xl leading-none">{formatRubles(thisMonthIncome)}</p>
                  {monthlyGoal > 0 && (
                    <p className={cn('text-[10px] mt-1', goalPct >= 100 ? 'text-emerald-400' : 'text-gray-400')}>
                      {goalPct >= 100 ? '✓ Цель выполнена' : `${goalPct.toFixed(0)}% от цели`}
                    </p>
                  )}
                </div>
                <div className="bg-white/8 rounded-2xl px-4 py-3.5 border border-white/5">
                  <p className="text-gray-400 text-[11px] mb-1">Чистая прибыль</p>
                  <p className={cn('font-bold text-xl leading-none', (totalIncome - totalExpenses - totalTax) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatRubles(totalIncome - totalExpenses - totalTax)}
                  </p>
                </div>
              </div>

              {/* Monthly goal bar */}
              {monthlyGoal > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-gray-400">Цель на {MONTH_SHORT[currentMonth - 1]}: {formatRubles(monthlyGoal)}</span>
                    <span className={cn('font-bold', goalPct >= 100 ? 'text-emerald-400' : 'text-indigo-300')}>
                      {goalPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', goalPct >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-400 to-violet-400')}
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* NPD limit bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-gray-400">Лимит НПД {currentYear}</span>
                  <span className={cn('font-bold', usagePct >= 90 ? 'text-red-400' : usagePct >= 75 ? 'text-amber-400' : 'text-indigo-300')}>
                    {usagePct.toFixed(1)}% · {remaining > 0 ? 'ост. ' + formatRubles(remaining) : 'исчерпан'}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${usagePct}%`,
                      background: usagePct >= 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                        : usagePct >= 75 ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                        : 'linear-gradient(90deg,#6366f1,#a78bfa)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly goal setter */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Target className="w-4.5 h-4.5 w-[18px] h-[18px] text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Цель на месяц</p>
                  <p className="text-xs text-gray-400">
                    {monthlyGoal > 0 ? `${formatRubles(monthlyGoal)} / мес` : 'Не задана'}
                  </p>
                </div>
              </div>
              {!editingGoal && (
                <button
                  onClick={() => { setEditingGoal(true); setGoalInput(monthlyGoal > 0 ? String(monthlyGoal) : '') }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> {monthlyGoal > 0 ? 'Изменить' : 'Установить'}
                </button>
              )}
            </div>

            {editingGoal && (
              <div className="flex gap-2 mt-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="200 000"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                    autoFocus
                    className="w-full rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                </div>
                <button
                  onClick={saveGoal}
                  className="w-10 h-10 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}

            {monthlyGoal > 0 && !editingGoal && (
              <div className="mt-4">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', goalPct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-violet-500 to-purple-400')}
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{formatRubles(thisMonthIncome)} заработано</span>
                  <span>{formatRubles(Math.max(monthlyGoal - thisMonthIncome, 0))} осталось</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={cn('flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white text-sm font-semibold transition-all shadow-sm', color)}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          {/* Smart Insights */}
          {(incomeMomentum !== null || thisMonthTax > 0 || topExpenseCategory || nextDeadline) && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 px-0.5">Инсайты</p>
              <div className="grid grid-cols-2 gap-3">

                {/* Income momentum */}
                {incomeMomentum !== null && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', incomeMomentum >= 0 ? 'bg-emerald-100' : 'bg-rose-100')}>
                        {incomeMomentum >= 0
                          ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                          : <ArrowDown className="w-3.5 h-3.5 text-rose-600" />}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Динамика</span>
                    </div>
                    <p className={cn('text-xl font-bold leading-none', incomeMomentum >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {incomeMomentum >= 0 ? '+' : ''}{incomeMomentum.toFixed(0)}%
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">vs {MONTH_SHORT[lastMonth - 1]}</p>
                  </div>
                )}

                {/* NPD tax this month */}
                {isNpd && thisMonthTax > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Налог НПД</span>
                    </div>
                    <p className="text-xl font-bold leading-none text-amber-600">{formatRubles(thisMonthTax)}</p>
                    <p className="text-[11px] text-gray-400 mt-1">до {taxDueLabel}</p>
                  </div>
                )}

                {/* Top expense category */}
                {topExpenseCategory && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Топ расход</span>
                    </div>
                    <p className="text-sm font-bold leading-tight text-gray-900 truncate">{topExpenseCategory[0]}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatRubles(topExpenseCategory[1])}</p>
                  </div>
                )}

                {/* Next deadline */}
                {nextDeadline && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', nextDeadline.days <= 7 ? 'bg-red-100' : 'bg-indigo-100')}>
                        <AlertCircle className={cn('w-3.5 h-3.5', nextDeadline.days <= 7 ? 'text-red-600' : 'text-indigo-600')} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Дедлайн</span>
                    </div>
                    <p className={cn('text-xl font-bold leading-none', nextDeadline.days <= 7 ? 'text-red-600' : 'text-indigo-600')}>
                      {nextDeadline.days === 0 ? 'сегодня' : `${nextDeadline.days} дн.`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{nextDeadline.title}</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Year stats */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Итоги {currentYear} года</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Доходы', value: formatRubles(totalIncome), color: 'text-indigo-600' },
                { label: 'Расходы', value: formatRubles(totalExpenses), color: 'text-rose-600' },
                { label: 'Налоги', value: formatRubles(totalTax), color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={cn('text-lg font-bold leading-none', color)}>{value}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* НПД tax schedule */}
          {isNpd && <NpdTaxSchedule compact />}

          {/* Upcoming deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-gray-900">Ближайшие дедлайны</p>
                </div>
                <Link href="/deadlines" className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                  Все <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingDeadlines.map((d) => {
                  const days = getDaysUntil(d.date)
                  return (
                    <div key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold',
                        days <= 7 ? 'bg-red-600' : days <= 30 ? 'bg-amber-500' : 'bg-indigo-600'
                      )}>
                        {days === 0 ? '!' : days}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{d.title}</p>
                        <p className="text-xs text-gray-400">{d.date.split('-').reverse().slice(0, 2).join('.')} · {d.regime.join(', ')}</p>
                      </div>
                      <span className={cn(
                        'text-[11px] font-bold px-2 py-1 rounded-full shrink-0',
                        days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {days === 0 ? 'сегодня' : `${days} дн.`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent incomes */}
          {recentIncomes.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <p className="text-sm font-bold text-gray-900">Последние доходы</p>
                </div>
                <Link href="/dashboard" className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                  Все <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentIncomes.map((income) => (
                  <div key={income.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px] font-bold',
                      income.isLegal ? 'bg-emerald-500' : 'bg-indigo-500'
                    )}>
                      {formatDate(income.date)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{income.description}</p>
                      {income.clientName && (
                        <p className="text-[11px] text-sky-600">{income.clientName}</p>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-sm shrink-0">{formatRubles(income.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {incomes.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="font-bold text-gray-900 mb-2">Начните вести учёт</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Добавьте первый доход, чтобы видеть статистику и следить за налоговой нагрузкой
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm transition-colors shadow-sm shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> Добавить доход
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
