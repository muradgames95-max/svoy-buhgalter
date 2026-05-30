'use client'

import { useState } from 'react'
import { Heart, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'

const INSURANCE_AMOUNT = 35_000
const RATE = 0.0384
const MONTHLY_PAYMENT = Math.round(INSURANCE_AMOUNT * RATE)

function formatRub(n: number) {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
}

export default function SickLeaveCalculator() {
  const [months, setMonths] = useState(12)
  const [daysPerYear, setDaysPerYear] = useState(10)

  const totalPaid = MONTHLY_PAYMENT * months
  const pct = months >= 12 ? 1 : months >= 6 ? 0.7 : 0
  const dailyBenefit = Math.round((INSURANCE_AMOUNT * pct) / 30)
  const yearlyBenefit = dailyBenefit * daysPerYear
  const net = yearlyBenefit - totalPaid
  const isWorth = net > 0 && months >= 6

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Калькулятор больничного</p>
            <p className="text-xs text-rose-600 font-medium">Новый закон 2026 · Эксперимент СФР</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            С 1 января 2026 самозанятые могут добровольно застраховаться в СФР
            и получать выплаты при болезни. Взнос — <strong>{formatRub(MONTHLY_PAYMENT)}/мес</strong>, страховая сумма — <strong>{formatRub(INSURANCE_AMOUNT)}</strong>.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Сколько месяцев платишь взносы</label>
              <span className="text-sm font-black text-indigo-600">{months} мес.</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 мес</span>
              <span className="text-amber-600 font-medium">6 мес (право на выплату)</span>
              <span>24 мес</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Дней на больничном в год</label>
              <span className="text-sm font-black text-indigo-600">{daysPerYear} дн.</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={daysPerYear}
              onChange={(e) => setDaysPerYear(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-2xl p-3.5">
            <p className="text-xs text-gray-500 mb-1">Взносы за {months} мес.</p>
            <p className="text-lg font-black text-gray-700">{formatRub(totalPaid)}</p>
          </div>
          <div className={`rounded-2xl p-3.5 ${months < 6 ? 'bg-gray-50' : 'bg-rose-50'}`}>
            <p className="text-xs text-gray-500 mb-1">Выплата в день</p>
            <p className={`text-lg font-black ${months < 6 ? 'text-gray-400' : 'text-rose-600'}`}>
              {months < 6 ? '— нет права' : formatRub(dailyBenefit)}
            </p>
          </div>
        </div>

        {months >= 6 && (
          <div className={`rounded-2xl p-4 border ${isWorth ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className={`w-4 h-4 ${isWorth ? 'text-emerald-500' : 'text-gray-400'}`} />
              <p className={`text-sm font-bold ${isWorth ? 'text-emerald-700' : 'text-gray-600'}`}>
                {isWorth ? 'Выгодно при твоей ситуации' : 'Не окупается при таких параметрах'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-500">Выплат в год</p>
                <p className="text-sm font-black text-gray-900">{formatRub(yearlyBenefit)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Взносов в год</p>
                <p className="text-sm font-black text-gray-900">{formatRub(MONTHLY_PAYMENT * 12)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Чистая выгода</p>
                <p className={`text-sm font-black ${net > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {net > 0 ? '+' : ''}{formatRub(net)}
                </p>
              </div>
            </div>
          </div>
        )}

        {months < 6 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5">
            <p className="text-xs text-indigo-700 font-medium">
              💡 Чтобы получать выплаты, нужно минимум 6 месяцев взносов. Регистрируйся сейчас — через полгода будешь застрахован.
            </p>
          </div>
        )}

        {/* CTA */}
        <a
          href="https://sfr.gov.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors shadow-md shadow-rose-200"
        >
          Зарегистрироваться в СФР
          <ExternalLink className="w-4 h-4" />
        </a>

        <p className="text-[10px] text-gray-400 text-center">
          Эксперимент действует 2026–2028 · Ставка взноса 3,84% · Страховая сумма 35 000 ₽
        </p>
      </div>
    </div>
  )
}
