'use client'

import { useState, useMemo } from 'react'
import { Trophy, Info, Users, TrendingDown, ChevronDown } from 'lucide-react'
import { calcAllRegimes, FIXED_CONTRIBUTIONS_2026 } from '@/lib/tax-calculator'
import { formatRubles } from '@/lib/utils'
import { cn } from '@/lib/utils'

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; grad: string }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', grad: 'from-emerald-500 to-teal-500' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700',  grad: 'from-indigo-500 to-violet-500' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700',  grad: 'from-violet-500 to-purple-500' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700',      grad: 'from-rose-500 to-pink-500'   },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     badge: 'bg-sky-100 text-sky-700',        grad: 'from-sky-500 to-cyan-500'    },
}

function fmt(n: number) { return Math.round(n / 1000) + 'к' }

export default function TaxCalculator() {
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState('')
  const [hasEmployees, setHasEmployees] = useState(false)
  const [calculated, setCalculated] = useState(false)

  const incomeNum = parseFloat(income.replace(/\s/g, '').replace(',', '.')) || 0
  const expensesNum = parseFloat(expenses.replace(/\s/g, '').replace(',', '.')) || 0

  const scenarios = useMemo(
    () => (calculated && incomeNum > 0 ? calcAllRegimes(incomeNum, expensesNum, hasEmployees) : []),
    [calculated, incomeNum, expensesNum, hasEmployees]
  )

  const best = scenarios.find((s) => s.available)
  const maxTotal = Math.max(...scenarios.map((s) => s.total), 1)
  const osno = scenarios.find((s) => s.shortName === 'ОСНО')

  function handleCalc() {
    if (incomeNum > 0) setCalculated(true)
  }

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-gray-900 text-base">Введите ваши данные</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Доход за год
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="1 500 000"
                value={income}
                onChange={(e) => { setIncome(e.target.value); setCalculated(false) }}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 bg-gray-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₽</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Расходы <span className="text-gray-400 font-normal normal-case">(необязательно)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="300 000"
                value={expenses}
                onChange={(e) => { setExpenses(e.target.value); setCalculated(false) }}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 bg-gray-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₽</span>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => { setHasEmployees(!hasEmployees); setCalculated(false) }}
          className="flex items-center gap-3 w-full"
        >
          <div className={cn(
            'w-11 h-6 rounded-full transition-colors relative shrink-0',
            hasEmployees ? 'bg-indigo-600' : 'bg-gray-200'
          )}>
            <div className={cn(
              'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow',
              hasEmployees ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </div>
          <div className="flex items-center gap-2 text-left">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Есть наёмные сотрудники</span>
          </div>
        </button>

        <button
          onClick={handleCalc}
          disabled={incomeNum <= 0}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors shadow-sm shadow-indigo-200 text-sm"
        >
          Рассчитать и сравнить режимы
        </button>
      </div>

      {/* Results */}
      {calculated && scenarios.length > 0 && (
        <div className="space-y-4">
          {/* Winner banner */}
          {best && (
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-950 to-indigo-950 p-5">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0 shadow-lg">
                  <Trophy className="w-5 h-5 text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs mb-1">Оптимальный режим</p>
                  <p className="text-white font-bold text-lg">{best.regime}</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Нагрузка:{' '}
                    <span className="text-yellow-400 font-bold">{formatRubles(best.total)}/год</span>
                    <span className="text-gray-500"> · {best.effectiveRate.toFixed(1)}%</span>
                  </p>
                  {osno && osno.total > best.total && (
                    <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Экономия vs ОСНО: {formatRubles(osno.total - best.total)} в год
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map((s) => {
              const c = COLOR_MAP[s.color]
              const isWinner = s === best
              return (
                <div
                  key={s.shortName}
                  className={cn(
                    'rounded-2xl border p-5 transition-all',
                    !s.available
                      ? 'opacity-50 bg-gray-50 border-gray-200'
                      : isWinner
                      ? cn(c.bg, c.border)
                      : 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{s.shortName}</span>
                        {isWinner && (
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide', c.badge)}>
                            Лучший
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.regime}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{fmt(s.total)}</p>
                      <p className="text-[11px] text-gray-400">{s.effectiveRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r', s.available ? c.grad : 'from-gray-300 to-gray-300')}
                      style={{ width: `${(s.total / maxTotal) * 100}%` }}
                    />
                  </div>

                  {s.reason ? (
                    <p className="text-xs text-rose-500 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {s.reason}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {s.details.map((d) => (
                        <li key={d} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-px shrink-0">·</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.available && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Налог</p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">{formatRubles(s.tax)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Взносы</p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">{formatRubles(s.contributions)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-700">
            <strong>Примечание:</strong> Расчёт приблизительный. Не учитывает региональные льготы и патентную стоимость. Для точного расчёта проконсультируйтесь с бухгалтером.
          </div>
        </div>
      )}

      {/* Contributions info */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ChevronDown className="w-4 h-4 text-gray-400" />
          <h3 className="font-bold text-gray-900 text-sm">Страховые взносы ИП в 2026</h3>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Фиксированная часть (ОПС + ОМС)</span>
            <span className="font-bold text-gray-900 text-sm">{formatRubles(FIXED_CONTRIBUTIONS_2026)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">1% с дохода свыше 300 000 ₽</span>
            <span className="font-bold text-gray-900 text-sm">
              {incomeNum > 300_000 ? formatRubles(Math.min((incomeNum - 300_000) * 0.01, 277_571)) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-semibold text-gray-900">Итого взносов</span>
            <span className="font-bold text-indigo-600">
              {incomeNum > 0
                ? formatRubles(FIXED_CONTRIBUTIONS_2026 + Math.min(Math.max((incomeNum - 300_000) * 0.01, 0), 277_571))
                : formatRubles(FIXED_CONTRIBUTIONS_2026) + '+'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
