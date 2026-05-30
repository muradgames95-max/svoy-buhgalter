'use client'

import { useMemo } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { formatRubles } from '@/lib/utils'

interface TaxForecastProps {
  incomes: { date: string; amount: number; isLegal: boolean }[]
  totalIncome: number
  isNpd: boolean
  isUsn6: boolean
  isUsn15: boolean
  totalExpenses: number
}

const NPD_LIMIT = 2_400_000
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export default function TaxForecast({
  incomes,
  totalIncome,
  isNpd,
  isUsn6,
  isUsn15,
  totalExpenses,
}: TaxForecastProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const dayOfMonth = new Date().getDate()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const { projected, projectedTax, risk, monthlyAvg, barData, pctOfLimit } = useMemo(() => {
    const yearIncomes = incomes.filter(
      (i) => parseInt(i.date.split('-')[0]) === currentYear,
    )

    const monthsElapsed = currentMonth + dayOfMonth / daysInMonth
    const monthlyAvg = monthsElapsed > 0 ? totalIncome / monthsElapsed : 0
    const projected = monthlyAvg * 12

    const expenseRatio =
      totalIncome > 0 ? (totalExpenses / totalIncome) : 0

    let projectedTax = 0
    if (isNpd) {
      const actualTaxRatio =
        totalIncome > 0
          ? yearIncomes.reduce(
              (s, i) => s + (i.isLegal ? i.amount * 0.06 : i.amount * 0.04),
              0,
            ) / totalIncome
          : 0.05
      projectedTax = projected * (actualTaxRatio || 0.05)
    } else if (isUsn6) {
      projectedTax = projected * 0.06
    } else if (isUsn15) {
      const projectedExpenses = projected * expenseRatio
      projectedTax = Math.max(
        projected * 0.01,
        Math.max(0, projected - projectedExpenses) * 0.15,
      )
    }

    const pctOfLimit = isNpd ? (projected / NPD_LIMIT) * 100 : 0

    let risk: 'low' | 'medium' | 'high' = 'low'
    if (isNpd && pctOfLimit > 90) risk = 'high'
    else if (isNpd && pctOfLimit > 70) risk = 'medium'

    const barData = MONTHS.map((m, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`
      const actual = yearIncomes
        .filter((inc) => inc.date.startsWith(key))
        .reduce((s, inc) => s + inc.amount, 0)
      const isProjected = i > currentMonth
      return {
        m,
        actual,
        projectedVal: isProjected ? monthlyAvg : 0,
        isProjected,
        isCurrent: i === currentMonth,
      }
    })

    return { projected, projectedTax, risk, monthlyAvg, barData, pctOfLimit }
  }, [
    incomes,
    totalIncome,
    isNpd,
    isUsn6,
    isUsn15,
    totalExpenses,
    currentYear,
    currentMonth,
    dayOfMonth,
    daysInMonth,
  ])

  if (totalIncome === 0) return null

  const maxVal = Math.max(
    ...barData.map((d) => Math.max(d.actual, d.projectedVal)),
    1,
  )
  const barH = 56
  const barW = 16
  const barGap = 6
  const totalW = (barW + barGap) * 12 - barGap

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-bold text-gray-900 text-sm">
            Прогноз на {new Date().getFullYear()} год
          </p>
          <p className="text-xs text-gray-400 mt-0.5">По текущей динамике доходов</p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${
            risk === 'high'
              ? 'bg-red-50 text-red-600'
              : risk === 'medium'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {risk !== 'low' ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {risk === 'high'
            ? 'Риск превышения'
            : risk === 'medium'
              ? 'Лимит под угрозой'
              : 'Всё хорошо'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-indigo-500 mb-1">Прогноз дохода</p>
          <p className="text-base font-bold text-indigo-700 leading-none">
            {formatRubles(Math.round(projected))}
          </p>
          {monthlyAvg > 0 && (
            <p className="text-[10px] text-indigo-400 mt-1">
              {formatRubles(Math.round(monthlyAvg))}/мес среднее
            </p>
          )}
        </div>
        <div className="bg-amber-50 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-amber-500 mb-1">Прогноз налога</p>
          <p className="text-base font-bold text-amber-700 leading-none">
            {formatRubles(Math.round(projectedTax))}
          </p>
          <p className="text-[10px] text-amber-400 mt-1">
            {isNpd ? '~НПД' : isUsn6 ? 'УСН 6%' : 'УСН 15%'}
          </p>
        </div>
      </div>

      {isNpd && (
        <div className="mb-4">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-gray-500">% лимита НПД по прогнозу</span>
            <span
              className={`font-bold ${
                pctOfLimit > 90
                  ? 'text-red-600'
                  : pctOfLimit > 70
                    ? 'text-amber-600'
                    : 'text-emerald-600'
              }`}
            >
              {pctOfLimit.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pctOfLimit, 100)}%`,
                background:
                  pctOfLimit > 90
                    ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                    : pctOfLimit > 70
                      ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                      : 'linear-gradient(90deg,#10b981,#34d399)',
              }}
            />
          </div>
        </div>
      )}

      <div className="relative" style={{ height: barH + 18 }}>
        <svg
          width="100%"
          viewBox={`0 0 ${totalW} ${barH + 18}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="tfActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {barData.map((d, i) => {
            const x = i * (barW + barGap)
            const val = d.isProjected ? d.projectedVal : d.actual
            const h = Math.max(
              val > 0 ? (val / maxVal) * barH : 0,
              val > 0 ? 3 : 0,
            )
            return (
              <g key={d.m}>
                <rect
                  x={x}
                  y={barH - h}
                  width={barW}
                  height={h || 1.5}
                  rx={3}
                  fill={d.isProjected ? '#e0e7ff' : 'url(#tfActualGrad)'}
                  opacity={d.isProjected ? 0.9 : d.isCurrent ? 1 : 0.8}
                />
                {d.isProjected && h > 3 && (
                  <rect
                    x={x}
                    y={barH - h}
                    width={barW}
                    height={h}
                    rx={3}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    strokeOpacity={0.4}
                  />
                )}
                <text
                  x={x + barW / 2}
                  y={barH + 13}
                  textAnchor="middle"
                  style={{
                    fontSize: 7.5,
                    fill: d.isCurrent ? '#6366f1' : '#9ca3af',
                    fontWeight: d.isCurrent ? 700 : 400,
                  }}
                >
                  {d.m}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="absolute bottom-0 right-0 flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1 text-indigo-600">
            <span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />
            факт
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-2 h-2 rounded-sm bg-indigo-200 inline-block border border-indigo-300" style={{ borderStyle: 'dashed' }} />
            прогноз
          </span>
        </div>
      </div>
    </div>
  )
}
