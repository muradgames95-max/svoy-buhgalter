'use client'

import { useState, useEffect, useMemo } from 'react'
import { Receipt, CheckCircle2, Circle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { cn, formatRubles, calculateNPDTax } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'

interface Income { id: string; amount: number; isLegal: boolean; date: string }

interface MonthEntry {
  key: string          // YYYY-MM
  label: string        // "Май 2026"
  dueDate: string      // "28 июня 2026"
  totalIncome: number
  tax: number
  isPast: boolean
  isPaid: boolean
}

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTH_GEN   = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function buildDueDate(year: number, month: number): string {
  // НПД: pay by 28th of the next month
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  return `28 ${MONTH_GEN[nextMonth - 1]} ${nextYear}`
}

function isDuePast(year: number, month: number): boolean {
  const due = new Date(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 28)
  return due < new Date()
}

export default function NpdTaxSchedule({ compact = false }: { compact?: boolean }) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState(!compact)

  useEffect(() => {
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, []))
    setPaidMap(loadFromStorage<Record<string, boolean>>(STORAGE_KEYS.TAX_PAID, {}))
  }, [])

  const months = useMemo<MonthEntry[]>(() => {
    const map: Record<string, { total: number; tax: number }> = {}
    incomes.forEach((i) => {
      const [y, m] = i.date.split('-')
      const key = `${y}-${m}`
      if (!map[key]) map[key] = { total: 0, tax: 0 }
      map[key].total += i.amount
      map[key].tax += calculateNPDTax(i.amount, i.isLegal)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { total, tax }]) => {
        const [y, m] = key.split('-').map(Number)
        return {
          key,
          label: `${MONTH_NAMES[m - 1]} ${y}`,
          dueDate: buildDueDate(y, m),
          totalIncome: total,
          tax,
          isPast: isDuePast(y, m),
          isPaid: paidMap[key] ?? false,
        }
      })
  }, [incomes, paidMap])

  function togglePaid(key: string) {
    const next = { ...paidMap, [key]: !paidMap[key] }
    setPaidMap(next)
    saveToStorage(STORAGE_KEYS.TAX_PAID, next)
  }

  const totalOwed = months.filter((m) => !m.isPaid).reduce((s, m) => s + m.tax, 0)
  const paidCount = months.filter((m) => m.isPaid).length

  if (months.length === 0) return null

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100"
        onClick={() => compact && setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">Мой налоговый план (НПД)</p>
            <p className="text-xs text-gray-400">
              {paidCount > 0 ? `${paidCount} из ${months.length} месяцев оплачено` : `Оплатить: ${formatRubles(totalOwed)}`}
            </p>
          </div>
        </div>
        {compact && (
          expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <>
          {/* Hint */}
          <div className="flex items-start gap-2 mx-5 mt-4 mb-1 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              НПД автоматически списывается до <strong>28 числа</strong> следующего месяца через приложение «Мой налог».
              Отмечайте оплаченные месяцы для контроля.
            </p>
          </div>

          <div className="divide-y divide-gray-50 mt-2">
            {months.map((m) => (
              <div
                key={m.key}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors',
                  m.isPaid ? 'opacity-60' : m.isPast ? 'bg-red-50/40' : ''
                )}
              >
                {/* Toggle paid */}
                <button
                  onClick={() => togglePaid(m.key)}
                  className={cn(
                    'shrink-0 transition-colors',
                    m.isPaid ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-500'
                  )}
                >
                  {m.isPaid
                    ? <CheckCircle2 className="w-6 h-6" />
                    : <Circle className="w-6 h-6" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('font-semibold text-sm', m.isPaid ? 'line-through text-gray-400' : 'text-gray-900')}>
                      {m.label}
                    </p>
                    {m.isPast && !m.isPaid && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Просрочено
                      </span>
                    )}
                    {m.isPaid && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                        Оплачено
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Доход: {formatRubles(m.totalIncome)} · Срок: {m.dueDate}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className={cn('font-bold text-base', m.isPaid ? 'text-gray-400' : m.isPast ? 'text-red-600' : 'text-amber-600')}>
                    {formatRubles(m.tax)}
                  </p>
                  <p className="text-[10px] text-gray-400">НПД</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {totalOwed > 0 && (
            <div className="mx-5 mb-5 mt-2 flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">К оплате</p>
                <p className="text-xs text-amber-600 mt-0.5">{months.filter((m) => !m.isPaid).length} месяцев</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{formatRubles(totalOwed)}</p>
            </div>
          )}

          {totalOwed === 0 && months.length > 0 && (
            <div className="mx-5 mb-5 mt-2 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">Все налоги оплачены!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
