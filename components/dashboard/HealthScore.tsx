'use client'

import { useMemo } from 'react'

interface HealthScoreProps {
  totalIncome: number
  totalExpenses: number
  totalTax: number
  npdUsagePct: number
  isNpd: boolean
  incomeMomentum: number | null
  monthlyGoalPct: number
  hasData: boolean
}

function arcPath(cx: number, cy: number, r: number, pct: number) {
  if (pct <= 0) return ''
  if (pct >= 1) pct = 0.9999
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + pct * 2 * Math.PI
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const large = pct > 0.5 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

export default function HealthScore({
  totalIncome,
  totalExpenses,
  totalTax,
  npdUsagePct,
  isNpd,
  incomeMomentum,
  monthlyGoalPct,
  hasData,
}: HealthScoreProps) {
  const { score, grade, color, strokeColor, bgColor, factors } = useMemo(() => {
    let s = 40
    const factors: { text: string; ok: boolean }[] = []

    if (!hasData) {
      return {
        score: 0,
        grade: 'Нет данных',
        color: '#9ca3af',
        strokeColor: '#e5e7eb',
        bgColor: 'bg-gray-50',
        factors: [{ text: 'Добавьте первый доход для анализа', ok: false }],
      }
    }

    // Has income
    if (totalIncome > 0) {
      s += 15
      factors.push({ text: 'Есть записи доходов', ok: true })
    }

    // NPD limit
    if (isNpd) {
      if (npdUsagePct < 60) {
        s += 20
        factors.push({ text: 'Лимит НПД в норме', ok: true })
      } else if (npdUsagePct < 85) {
        s += 8
        factors.push({ text: 'Лимит НПД приближается', ok: false })
      } else {
        s -= 5
        factors.push({ text: 'Лимит НПД почти исчерпан', ok: false })
      }
    }

    // Expense ratio
    if (totalIncome > 0) {
      const ratio = totalExpenses / totalIncome
      if (ratio < 0.25) {
        s += 15
        factors.push({ text: 'Расходы под контролем', ok: true })
      } else if (ratio > 0.6) {
        s -= 8
        factors.push({ text: 'Высокая доля расходов', ok: false })
      } else {
        s += 5
        factors.push({ text: 'Умеренные расходы', ok: true })
      }
    }

    // Income momentum
    if (incomeMomentum !== null) {
      if (incomeMomentum > 5) {
        s += 10
        factors.push({ text: 'Доходы растут', ok: true })
      } else if (incomeMomentum < -15) {
        s -= 8
        factors.push({ text: 'Снижение доходов', ok: false })
      }
    }

    // Monthly goal
    if (monthlyGoalPct >= 100) {
      s += 10
      factors.push({ text: 'Месячная цель выполнена', ok: true })
    }

    const clamped = Math.max(5, Math.min(100, s))
    const grade = clamped >= 80 ? 'Отлично' : clamped >= 60 ? 'Хорошо' : clamped >= 40 ? 'Нормально' : 'Требует внимания'
    const color = clamped >= 80 ? '#10b981' : clamped >= 60 ? '#6366f1' : clamped >= 40 ? '#f59e0b' : '#ef4444'
    const strokeColor = clamped >= 80 ? '#10b981' : clamped >= 60 ? '#6366f1' : clamped >= 40 ? '#f59e0b' : '#ef4444'
    const bgColor = clamped >= 80 ? 'bg-emerald-50' : clamped >= 60 ? 'bg-indigo-50' : clamped >= 40 ? 'bg-amber-50' : 'bg-rose-50'

    return { score: clamped, grade, color, strokeColor, bgColor, factors: factors.slice(0, 4) }
  }, [totalIncome, totalExpenses, totalTax, npdUsagePct, isNpd, incomeMomentum, monthlyGoalPct, hasData])

  const cx = 52, cy = 52, r = 42
  const pct = score / 100

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <p className="font-bold text-gray-900 text-sm mb-4">Финансовое здоровье</p>
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg width={104} height={104} viewBox="0 0 104 104">
            {/* Track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={9} />
            {/* Progress */}
            {pct > 0 && (
              <path
                d={arcPath(cx, cy, r, pct)}
                fill="none"
                stroke={strokeColor}
                strokeWidth={9}
                strokeLinecap="round"
              />
            )}
            {/* Score */}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              style={{ fontSize: 24, fontWeight: 800, fill: color, fontFamily: 'inherit' }}
            >
              {score}
            </text>
            <text
              x={cx}
              y={cy + 13}
              textAnchor="middle"
              style={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'inherit' }}
            >
              {grade}
            </text>
          </svg>
        </div>

        {/* Factors */}
        <div className="flex-1 space-y-2.5">
          {factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px ${f.ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <div className={`w-2 h-2 rounded-full ${f.ok ? 'bg-emerald-500' : 'bg-rose-400'}`} />
              </div>
              <p className="text-xs text-gray-600 leading-snug">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-4 pt-4 border-t border-gray-50">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
          <span>0</span><span>50</span><span>100</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, ${strokeColor}cc, ${strokeColor})` }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span className="text-rose-400">Критично</span>
          <span className="text-amber-400">Средне</span>
          <span className="text-emerald-400">Отлично</span>
        </div>
      </div>
    </div>
  )
}
