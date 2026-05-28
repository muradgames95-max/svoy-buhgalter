'use client'

import { useState, useMemo } from 'react'
import { useEffect } from 'react'
import { Printer, TrendingUp, TrendingDown, Receipt, Calendar } from 'lucide-react'
import { cn, formatRubles, calculateNPDTax } from '@/lib/utils'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'

interface Income {
  id: string
  amount: number
  date: string
  description: string
  isLegal: boolean
  clientName?: string
}

interface Expense {
  id: string
  amount: number
  date: string
  description: string
  category?: string
}

const QUARTERS = [
  { label: 'I кв. (янв–мар)', months: [1, 2, 3] },
  { label: 'II кв. (апр–июн)', months: [4, 5, 6] },
  { label: 'III кв. (июл–сен)', months: [7, 8, 9] },
  { label: 'IV кв. (окт–дек)', months: [10, 11, 12] },
]

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

type Period = 'q1' | 'q2' | 'q3' | 'q4' | 'year' | 'custom'

function getCurrentQuarter(): Period {
  const m = new Date().getMonth() + 1
  if (m <= 3) return 'q1'
  if (m <= 6) return 'q2'
  if (m <= 9) return 'q3'
  return 'q4'
}

export default function ReportGenerator() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [period, setPeriod] = useState<Period>(getCurrentQuarter)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, []))
    setExpenses(loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []))
  }, [])

  const months: number[] = useMemo(() => {
    if (period === 'year') return [1,2,3,4,5,6,7,8,9,10,11,12]
    if (period === 'custom') return []
    const idx = parseInt(period.replace('q','')) - 1
    return QUARTERS[idx].months
  }, [period])

  const filtered = useMemo(() => {
    if (period === 'custom' && customFrom && customTo) {
      return {
        incomes: incomes.filter((i) => i.date >= customFrom && i.date <= customTo),
        expenses: expenses.filter((e) => e.date >= customFrom && e.date <= customTo),
      }
    }
    return {
      incomes: incomes.filter((i) => {
        const m = parseInt(i.date.split('-')[1])
        const y = parseInt(i.date.split('-')[0])
        return y === year && months.includes(m)
      }),
      expenses: expenses.filter((e) => {
        const m = parseInt(e.date.split('-')[1])
        const y = parseInt(e.date.split('-')[0])
        return y === year && months.includes(m)
      }),
    }
  }, [incomes, expenses, period, year, months, customFrom, customTo])

  const totalIncome = filtered.incomes.reduce((s, i) => s + i.amount, 0)
  const totalTax = filtered.incomes.reduce((s, i) => s + calculateNPDTax(i.amount, i.isLegal), 0)
  const totalExpenses = filtered.expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = totalIncome - totalTax - totalExpenses

  const monthlyIncome = useMemo(() => {
    const map: Record<number, number> = {}
    for (const i of filtered.incomes) {
      const m = parseInt(i.date.split('-')[1])
      map[m] = (map[m] ?? 0) + i.amount
    }
    return map
  }, [filtered.incomes])

  const periodLabel = useMemo(() => {
    if (period === 'year') return `${year} год`
    if (period === 'custom') return customFrom && customTo ? `${customFrom} — ${customTo}` : 'Произвольный период'
    const idx = parseInt(period.replace('q','')) - 1
    return `${QUARTERS[idx].label} ${year}`
  }, [period, year, customFrom, customTo])

  function handlePrint() {
    window.print()
  }

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered.expenses) {
      const cat = e.category ?? 'Прочее'
      map[cat] = (map[cat] ?? 0) + e.amount
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered.expenses])

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1.5">Период</p>
            <div className="flex flex-wrap gap-1.5">
              {(['q1','q2','q3','q4','year','custom'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {p === 'year' ? 'Год' : p === 'custom' ? 'Свой' : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {period !== 'custom' && (
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1.5">Год</p>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {period === 'custom' && (
            <>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1.5">С</p>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1.5">По</p>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </>
          )}

          <button
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-950 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Сохранить PDF
          </button>
        </div>
      </div>

      {/* Report body */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between print:mb-6">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Финансовый отчёт</p>
            <h2 className="text-2xl font-black text-gray-900 mt-0.5">{periodLabel}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Свой Бухгалтер • сформировано {new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          <Calendar className="w-10 h-10 text-indigo-200 print:hidden" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Доходы', value: formatRubles(totalIncome), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Расходы', value: formatRubles(totalExpenses), icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Налог НПД', value: formatRubles(totalTax), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Чистая прибыль', value: formatRubles(netProfit), icon: TrendingUp, color: netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600', bg: netProfit >= 0 ? 'bg-indigo-50' : 'bg-rose-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cn('rounded-2xl p-4', bg)}>
              <Icon className={cn('w-4 h-4 mb-2', color)} />
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={cn('text-lg font-black mt-0.5', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Monthly breakdown */}
        {months.length > 1 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">По месяцам</p>
            <div className="space-y-2">
              {months.map((m) => {
                const amount = monthlyIncome[m] ?? 0
                const pct = totalIncome > 0 ? amount / totalIncome : 0
                return (
                  <div key={m} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{MONTH_NAMES[m - 1]}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-24 text-right">{formatRubles(amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expense categories */}
        {expenseByCategory.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Расходы по категориям</p>
            <div className="space-y-1.5">
              {expenseByCategory.map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{cat}</span>
                  <span className="text-sm font-bold text-gray-900">{formatRubles(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Income list */}
        {filtered.incomes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Доходы ({filtered.incomes.length})</p>
            <div className="space-y-1">
              {filtered.incomes.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                  <div>
                    <span className="text-gray-800">{i.description}</span>
                    {i.clientName && <span className="text-gray-400 ml-2">· {i.clientName}</span>}
                    <span className="text-gray-400 ml-2">{i.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{formatRubles(i.amount)}</span>
                    <span className="text-gray-400 ml-1 text-xs">налог {formatRubles(calculateNPDTax(i.amount, i.isLegal))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.incomes.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Нет данных за выбранный период</p>
          </div>
        )}
      </div>
    </div>
  )
}
