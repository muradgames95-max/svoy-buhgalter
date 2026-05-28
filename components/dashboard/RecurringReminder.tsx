'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, X } from 'lucide-react'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import { formatRubles, calculateNPDTax } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Income {
  id: string
  description: string
  amount: number
  isLegal: boolean
  date: string
  clientId?: string
  clientName?: string
  recurring?: boolean
}

export default function RecurringReminder() {
  const [show, setShow] = useState(false)
  const [recurring, setRecurring] = useState<Income[]>([])
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const incomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
    const recurringItems = incomes.filter((i) => i.recurring)
    if (recurringItems.length === 0) return

    // Check if we already showed reminder this month
    const reminderKey = `sb_recurring_reminder_${currentYear}_${currentMonth}`
    if (localStorage.getItem(reminderKey)) return

    // Find recurring from prev month
    const prevMonthRecurring = recurringItems.filter((i) => {
      const [y, m] = i.date.split('-').map(Number)
      return y === prevYear && m === prevMonth
    })

    if (prevMonthRecurring.length === 0) return

    // Check which ones aren't already in this month
    const thisMonthIds = new Set(
      incomes
        .filter((i) => {
          const [y, m] = i.date.split('-').map(Number)
          return y === currentYear && m === currentMonth && i.recurring
        })
        .map((i) => i.description)
    )

    const missing = prevMonthRecurring.filter((i) => !thisMonthIds.has(i.description))
    if (missing.length === 0) return

    setRecurring(missing)
    setShow(true)
  }, [])

  function addIncome(income: Income) {
    const today = new Date().toISOString().split('T')[0]
    const incomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
    const newIncome: Income = {
      ...income,
      id: Date.now().toString() + Math.random(),
      date: today,
    }
    saveToStorage(STORAGE_KEYS.INCOMES, [...incomes, newIncome])
    setAdded((prev) => new Set(prev).add(income.id))
  }

  function dismiss() {
    const today = new Date()
    const key = `sb_recurring_reminder_${today.getFullYear()}_${today.getMonth() + 1}`
    localStorage.setItem(key, '1')
    setShow(false)
  }

  if (!show || recurring.length === 0) return null

  const allAdded = recurring.every((i) => added.has(i.id))

  return (
    <div className="bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-600" />
          <p className="text-sm font-bold text-violet-900">Регулярные доходы за этот месяц</p>
        </div>
        <button onClick={dismiss} className="text-violet-400 hover:text-violet-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500 mb-3">
          В прошлом месяце у вас были регулярные доходы. Добавить за текущий?
        </p>
        {recurring.map((income) => {
          const isAdded = added.has(income.id)
          return (
            <div key={income.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{income.description}</p>
                <p className="text-xs text-gray-400">
                  {formatRubles(income.amount)} · налог {formatRubles(calculateNPDTax(income.amount, income.isLegal))}
                </p>
              </div>
              <button
                onClick={() => !isAdded && addIncome(income)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
                  isAdded
                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                )}
              >
                {isAdded ? '✓ Добавлен' : <><Plus className="w-3 h-3" />Добавить</>}
              </button>
            </div>
          )
        })}
        {allAdded && (
          <button
            onClick={dismiss}
            className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Закрыть
          </button>
        )}
      </div>
    </div>
  )
}
