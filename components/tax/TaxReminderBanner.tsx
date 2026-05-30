'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
interface Income { id: string; amount: number; isLegal: boolean; date: string }

function formatRub(n: number) {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
}

function calcTax(incomes: Income[]): number {
  const physical = incomes.filter((i) => !i.isLegal).reduce((s, i) => s + i.amount, 0)
  const legal = incomes.filter((i) => i.isLegal).reduce((s, i) => s + i.amount, 0)
  return Math.round(physical * 0.04 + legal * 0.06)
}

export default function TaxReminderBanner() {
  const [show, setShow] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const today = new Date()
    const day = today.getDate()
    if (day < 23 || day > 28) return

    const dismissKey = `sb_tax_banner_dismissed_${today.toISOString().slice(0, 7)}`
    if (localStorage.getItem(dismissKey) === '1') return

    // Calculate last month's tax
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthStr = lastMonth.toISOString().slice(0, 7)
    const incomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
    const monthIncomes = incomes.filter((i) => i.date?.startsWith(lastMonthStr))
    const tax = calcTax(monthIncomes)

    if (tax > 0) {
      setTaxAmount(tax)
      setShow(true)
    }
  }, [])

  function dismiss() {
    const today = new Date()
    const dismissKey = `sb_tax_banner_dismissed_${today.toISOString().slice(0, 7)}`
    localStorage.setItem(dismissKey, '1')
    setDismissed(true)
  }

  if (!show || dismissed) return null

  const today = new Date()
  const daysLeft = 28 - today.getDate()
  const isUrgent = daysLeft <= 2

  return (
    <div className={`rounded-2xl p-4 flex items-start gap-3 border ${
      isUrgent
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
          {daysLeft === 0
            ? 'Сегодня последний день — оплатите налог НПД!'
            : daysLeft === 1
            ? 'Завтра крайний срок оплаты налога НПД!'
            : `Осталось ${daysLeft} дня — оплатите налог НПД до 28-го`}
        </p>
        <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
          Расчётная сумма за прошлый месяц: <strong>{formatRub(taxAmount)}</strong>
        </p>
        <a
          href="https://lknpd.nalog.ru"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold ${
            isUrgent ? 'text-red-700 hover:text-red-900' : 'text-amber-700 hover:text-amber-900'
          }`}
        >
          Оплатить в «Мой налог»
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <button
        onClick={dismiss}
        className={`p-1 rounded-lg transition-colors shrink-0 ${
          isUrgent ? 'text-red-400 hover:bg-red-100' : 'text-amber-400 hover:bg-amber-100'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
