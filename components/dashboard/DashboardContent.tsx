'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, ShoppingBag, BarChart3, ArrowUp, ArrowDown, Minus, UserCircle } from 'lucide-react'
import { cn, formatRubles, calculateNPDTax } from '@/lib/utils'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
import IncomeTracker from './IncomeTracker'
import ExpenseTracker from './ExpenseTracker'
import RecurringReminder from './RecurringReminder'

type Tab = 'income' | 'expenses' | 'summary'

interface Income { id: string; amount: number; tax: number; isLegal: boolean; date: string; description: string; clientId?: string; clientName?: string }
interface Expense { id: string; amount: number; category: string; date: string; description: string }

const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

function DonutChart({ data, total, colors }: { data: [string, number][]; total: number; colors: string[] }) {
  const size = 160
  const strokeWidth = 28
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  const baseSlices = data.map(([cat, amt], idx) => {
    const pct = total > 0 ? amt / total : 0
    const dash = pct * circ
    return { cat, amt, pct, dash, gap: circ - dash, color: colors[idx % colors.length] }
  })
  const slices = baseSlices.map((s, idx) => ({
    ...s,
    offset: baseSlices.slice(0, idx).reduce((sum, p) => sum + p.dash, 0),
  }))

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {slices.map((s) => (
            <circle
              key={s.cat}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-s.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-bold text-gray-900">{formatRubles(total)}</span>
          <span className="text-[10px] text-gray-400">расходы</span>
        </div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {slices.map((s) => (
          <div key={s.cat} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="flex-1 text-xs text-gray-700 truncate">{s.cat}</span>
            <span className="text-xs font-bold text-gray-900 shrink-0">{formatRubles(s.amt)}</span>
            <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">{(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryView({ totalIncome, totalExpenses }: { totalIncome: number; totalExpenses: number }) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    function loadData() {
      const allIncomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
      const allExpenses = loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, [])
      setIncomes(allIncomes.filter((i) => parseInt(i.date.split('-')[0]) === currentYear))
      setExpenses(allExpenses.filter((e) => parseInt(e.date.split('-')[0]) === currentYear))
    }
    loadData()
    window.addEventListener('svoy-storage-updated', loadData)
    return () => window.removeEventListener('svoy-storage-updated', loadData)
  }, [currentYear])

  const tax = incomes.reduce((s, i) => s + calculateNPDTax(i.amount, i.isLegal), 0)
  const profit = totalIncome - totalExpenses
  const netAfterTax = profit - tax
  const profitPct = totalIncome > 0 ? (profit / totalIncome) * 100 : 0
  const expensePct = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0
  const incomePctBar = totalIncome > 0 ? 100 : 0

  // Expense categories
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [expenses])

  // Client revenue
  const clientTotals = useMemo(() => {
    const map: Record<string, number> = {}
    incomes.forEach((i) => {
      if (i.clientName) map[i.clientName] = (map[i.clientName] ?? 0) + i.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [incomes])

  const CAT_COLORS = ['from-rose-500 to-pink-500','from-orange-500 to-amber-400','from-violet-500 to-purple-400','from-sky-500 to-blue-400','from-emerald-500 to-teal-400','from-fuchsia-500 to-pink-400']
  const DONUT_COLORS = ['#f43f5e','#f97316','#8b5cf6','#0ea5e9','#10b981','#d946ef','#6366f1','#84cc16']

  // Monthly aggregation
  const monthlyData: Record<string, { income: number; expenses: number }> = {}
  incomes.forEach((i) => {
    const key = i.date?.slice(0, 7)
    if (!key) return
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 }
    monthlyData[key].income += i.amount
  })
  expenses.forEach((e) => {
    const key = e.date?.slice(0, 7)
    if (!key) return
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 }
    monthlyData[key].expenses += e.amount
  })
  const months = Object.keys(monthlyData).sort()
  const maxMonthVal = months.reduce((m, k) => Math.max(m, monthlyData[k].income, monthlyData[k].expenses), 1)

  return (
    <div className="space-y-4">
      {/* Hero profit */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-6 text-white shadow-lg shadow-violet-200">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-violet-300 text-sm font-medium mb-1">Чистая прибыль 2026</p>
          <div className="text-4xl font-bold tracking-tight mb-0.5">{formatRubles(profit)}</div>
          <p className="text-violet-300 text-sm">
            После налогов:{' '}
            <span className={cn('font-bold', netAfterTax >= 0 ? 'text-white' : 'text-red-300')}>
              {formatRubles(netAfterTax)}
            </span>
          </p>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="bg-white/10 rounded-2xl px-3 py-3">
              <p className="text-violet-300 text-[10px] mb-0.5">Доходы</p>
              <p className="text-white font-bold text-sm">{formatRubles(totalIncome)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-3">
              <p className="text-violet-300 text-[10px] mb-0.5">Расходы</p>
              <p className="text-white font-bold text-sm">{formatRubles(totalExpenses)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-3">
              <p className="text-violet-300 text-[10px] mb-0.5">Налоги</p>
              <p className="text-white font-bold text-sm">{formatRubles(tax)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income vs Expenses bars */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Доходы vs Расходы</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-indigo-600 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Доходы
              </span>
              <span className="font-bold text-gray-700">{formatRubles(totalIncome)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${incomePctBar}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-rose-600 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Расходы
              </span>
              <span className="font-bold text-gray-700">{formatRubles(totalExpenses)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${expensePct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Minus className="w-3 h-3" /> Налоги
              </span>
              <span className="font-bold text-gray-700">{formatRubles(tax)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${totalIncome > 0 ? Math.min((tax / totalIncome) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Рентабельность</span>
          <span className={cn(
            'text-sm font-bold px-3 py-1 rounded-full',
            profitPct >= 50 ? 'bg-emerald-100 text-emerald-700'
              : profitPct >= 20 ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
          )}>
            {profitPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Monthly chart */}
      {months.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">По месяцам</p>
          <div className="flex items-end gap-2 h-32">
            {months.map((key) => {
              const d = monthlyData[key]
              const [, m] = key.split('-')
              const monthName = MONTH_NAMES[parseInt(m) - 1]
              const incH = Math.round((d.income / maxMonthVal) * 96)
              const expH = Math.round((d.expenses / maxMonthVal) * 96)
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-24">
                    <div
                      className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t-lg min-h-[2px]"
                      style={{ height: `${incH}px` }}
                      title={`Доходы: ${formatRubles(d.income)}`}
                    />
                    <div
                      className="flex-1 bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-lg min-h-[2px]"
                      style={{ height: `${expH}px` }}
                      title={`Расходы: ${formatRubles(d.expenses)}`}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-gray-400 uppercase">{monthName}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              Доходы
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              Расходы
            </div>
          </div>
        </div>
      )}

      {/* Expense categories — donut chart */}
      {categoryTotals.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Расходы по категориям</p>
          <DonutChart data={categoryTotals} total={totalExpenses} colors={DONUT_COLORS} />
        </div>
      )}

      {/* Top clients by revenue */}
      {clientTotals.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Топ клиентов по доходу</p>
          <div className="space-y-3">
            {clientTotals.map(([name, amt], idx) => {
              const pct = totalIncome > 0 ? (amt / totalIncome) * 100 : 0
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                    <UserCircle className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">{name}</span>
                      <span className="font-bold text-gray-900 ml-2 shrink-0">{formatRubles(amt)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full shrink-0">#{idx + 1}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {months.length === 0 && totalIncome === 0 && totalExpenses === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Нет данных для сводки</p>
          <p className="text-xs text-gray-400 mt-1">Добавьте доходы и расходы</p>
        </div>
      )}
    </div>
  )
}

export default function DashboardContent() {
  const [tab, setTab] = useState<Tab>('income')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    function loadTotals() {
      const incomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
      const exps = loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, [])
      const yearIncomes = incomes.filter((i) => parseInt(i.date.split('-')[0]) === currentYear)
      const yearExpenses = exps.filter((e) => parseInt(e.date.split('-')[0]) === currentYear)
      setTotalIncome(yearIncomes.reduce((s, i) => s + i.amount, 0))
      setTotalExpenses(yearExpenses.reduce((s, e) => s + e.amount, 0))
    }
    loadTotals()
    window.addEventListener('svoy-storage-updated', loadTotals)
    return () => window.removeEventListener('svoy-storage-updated', loadTotals)
  }, [tab, currentYear])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n' || e.key === 'N') { setTab('income'); window.dispatchEvent(new CustomEvent('sb:open-add-income')) }
      if (e.key === 'e' || e.key === 'E') { setTab('expenses'); window.dispatchEvent(new CustomEvent('sb:open-add-expense')) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const TABS: { id: Tab; label: string; icon: React.ElementType; active: string }[] = [
    { id: 'income', label: 'Доходы', icon: TrendingUp, active: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' },
    { id: 'expenses', label: 'Расходы', icon: ShoppingBag, active: 'bg-rose-600 text-white shadow-sm shadow-rose-200' },
    { id: 'summary', label: 'Сводка', icon: BarChart3, active: 'bg-violet-600 text-white shadow-sm shadow-violet-200' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
        {TABS.map(({ id, label, icon: Icon, active }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === id ? active : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
          </button>
        ))}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono">N</kbd> доход
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono ml-1">E</kbd> расход
        </div>
      </div>

      {tab === 'income' && <><RecurringReminder /><IncomeTracker /></>}
      {tab === 'expenses' && <ExpenseTracker totalIncome={totalIncome} />}
      {tab === 'summary' && <SummaryView totalIncome={totalIncome} totalExpenses={totalExpenses} />}
    </div>
  )
}
