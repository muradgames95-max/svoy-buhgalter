'use client'

import { useMemo, useState } from 'react'
import { formatRubles } from '@/lib/utils'

interface MonthlyChartProps {
  incomes: { date: string; amount: number }[]
  expenses: { date: string; amount: number }[]
}

const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export default function MonthlyChart({ incomes, expenses }: MonthlyChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const data = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const key = `${year}-${String(month).padStart(2, '0')}`
      const income = incomes.filter(inc => inc.date.startsWith(key)).reduce((s, inc) => s + inc.amount, 0)
      const expense = expenses.filter(exp => exp.date.startsWith(key)).reduce((s, exp) => s + exp.amount, 0)
      return { key, label: MONTH_SHORT[d.getMonth()], income, expense, isCurrent: i === 5 }
    })
  }, [incomes, expenses])

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1)
  const chartH = 88
  const barW = 20
  const gap = 6
  const groupW = barW * 2 + gap
  const groupGap = 14
  const totalW = (groupW + groupGap) * 6 - groupGap

  const totalIncome = data[5].income
  const prevIncome = data[4].income
  const trend = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-bold text-gray-900 text-sm">Доходы vs Расходы</p>
          <p className="text-xs text-gray-400 mt-0.5">Последние 6 месяцев</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-indigo-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />Доходы
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Расходы
          </span>
        </div>
      </div>

      <div className="relative" style={{ height: chartH + 28 }}>
        <svg
          width="100%"
          viewBox={`0 0 ${totalW} ${chartH + 28}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="incGradActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {data.map((d, i) => {
            const gx = i * (groupW + groupGap)
            const incH = Math.max(d.income > 0 ? (d.income / maxVal) * chartH : 0, d.income > 0 ? 4 : 0)
            const expH = Math.max(d.expense > 0 ? (d.expense / maxVal) * chartH : 0, d.expense > 0 ? 4 : 0)
            const isHov = hovered === i
            return (
              <g key={d.key}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                {/* hover bg */}
                {isHov && (
                  <rect x={gx - 4} y={0} width={groupW + 8} height={chartH + 4} rx={6} fill="#f5f3ff" opacity={0.7} />
                )}
                {/* income bar */}
                <rect
                  x={gx}
                  y={chartH - incH}
                  width={barW}
                  height={incH || 2}
                  rx={4}
                  fill={d.isCurrent ? 'url(#incGradActive)' : 'url(#incGrad)'}
                  opacity={isHov ? 1 : d.isCurrent ? 1 : 0.75}
                />
                {/* expense bar */}
                <rect
                  x={gx + barW + gap}
                  y={chartH - expH}
                  width={barW}
                  height={expH || 2}
                  rx={4}
                  fill="url(#expGrad)"
                  opacity={isHov ? 1 : 0.65}
                />
                {/* month label */}
                <text
                  x={gx + groupW / 2}
                  y={chartH + 18}
                  textAnchor="middle"
                  style={{
                    fontSize: 10,
                    fill: d.isCurrent ? '#6366f1' : '#9ca3af',
                    fontWeight: d.isCurrent ? 700 : 400,
                  }}
                >
                  {d.label}
                </text>
                {/* tooltip on hover */}
                {isHov && d.income > 0 && (
                  <text
                    x={gx + groupW / 2}
                    y={chartH - incH - 6}
                    textAnchor="middle"
                    style={{ fontSize: 9, fill: '#6366f1', fontWeight: 700 }}
                  >
                    {(d.income / 1000).toFixed(0)}к
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Bottom stats */}
      <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400">Доходы</p>
            <p className="text-sm font-bold text-indigo-600">{totalIncome > 0 ? formatRubles(totalIncome) : '—'}</p>
          </div>
          {trend !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] text-gray-400">Расходы</p>
            <p className="text-sm font-bold text-rose-500">{data[5].expense > 0 ? formatRubles(data[5].expense) : '—'}</p>
          </div>
        </div>
        {(totalIncome > 0 || data[5].expense > 0) && (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-[11px] text-gray-400">Чистая прибыль</p>
            <p className={`text-sm font-bold ${totalIncome - data[5].expense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatRubles(totalIncome - data[5].expense)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
