'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Download, Pencil, Check, X, ShoppingBag, RefreshCw, Repeat2 } from 'lucide-react'
import { cn, formatRubles } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  recurring?: boolean
}

const CATEGORIES = [
  'Оборудование', 'ПО и сервисы', 'Реклама', 'Транспорт',
  'Связь', 'Обучение', 'Аренда', 'Прочее',
]

const CAT_COLORS: Record<string, string> = {
  'Оборудование': 'bg-blue-100 text-blue-700',
  'ПО и сервисы': 'bg-violet-100 text-violet-700',
  'Реклама': 'bg-pink-100 text-pink-700',
  'Транспорт': 'bg-orange-100 text-orange-700',
  'Связь': 'bg-cyan-100 text-cyan-700',
  'Обучение': 'bg-emerald-100 text-emerald-700',
  'Аренда': 'bg-amber-100 text-amber-700',
  'Прочее': 'bg-gray-100 text-gray-600',
}

const MONTH_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
function formatDate(d: string) {
  const [, m, day] = d.split('-')
  return `${parseInt(day)} ${MONTH_SHORT[parseInt(m) - 1]}`
}

const DEMO: Expense[] = [
  { id: '1', description: 'Figma подписка', amount: 1900, category: 'ПО и сервисы', date: '2026-05-02', recurring: true },
  { id: '2', description: 'Реклама ВКонтакте', amount: 15000, category: 'Реклама', date: '2026-05-08', recurring: false },
  { id: '3', description: 'Хостинг сервера', amount: 890, category: 'ПО и сервисы', date: '2026-05-01', recurring: true },
]

export default function ExpenseTracker({ totalIncome }: { totalIncome: number }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Прочее', recurring: false })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('Прочее')
  const [editRecurring, setEditRecurring] = useState(false)

  useEffect(() => {
    function loadData() {
      setExpenses(loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, DEMO))
    }
    loadData()
    setHydrated(true)
    window.addEventListener('svoy-storage-updated', loadData)
    return () => window.removeEventListener('svoy-storage-updated', loadData)
  }, [])

  function save(next: Expense[]) {
    setExpenses(next)
    saveToStorage(STORAGE_KEYS.EXPENSES, next)
  }

  const currentYear = new Date().getFullYear()
  const yearExpenses = useMemo(() =>
    expenses.filter((e) => parseInt(e.date.split('-')[0]) === currentYear),
    [expenses]
  )

  const total = yearExpenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalIncome - total
  const expenseRatio = totalIncome > 0 ? Math.min((total / totalIncome) * 100, 100) : 0
  const recurring = expenses.filter((e) => e.recurring)
  const recurringTotal = recurring.reduce((s, e) => s + e.amount, 0)

  function addExpense() {
    const amount = parseFloat(form.amount.replace(/\s/g, '').replace(',', '.'))
    if (!form.description.trim() || isNaN(amount) || amount <= 0) return
    save([...expenses, {
      id: Date.now().toString(),
      description: form.description.trim(),
      amount,
      category: form.category,
      recurring: form.recurring,
      date: new Date().toISOString().split('T')[0],
    }])
    setForm({ description: '', amount: '', category: 'Прочее', recurring: false })
    setShowForm(false)
  }

  function remove(id: string) {
    if (editingId === id) setEditingId(null)
    save(expenses.filter((e) => e.id !== id))
  }

  function startEdit(e: Expense) {
    setEditingId(e.id)
    setEditDesc(e.description)
    setEditAmount(String(e.amount))
    setEditCategory(e.category)
    setEditRecurring(e.recurring ?? false)
    setShowForm(false)
  }

  function saveEdit() {
    if (!editingId) return
    const amount = parseFloat(editAmount.replace(/\s/g, '').replace(',', '.'))
    if (!editDesc.trim() || isNaN(amount) || amount <= 0) return
    save(expenses.map((e) => e.id === editingId
      ? { ...e, description: editDesc.trim(), amount, category: editCategory, recurring: editRecurring }
      : e
    ))
    setEditingId(null)
  }

  function repeatExpense(e: Expense) {
    save([...expenses, {
      ...e,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
    }])
  }

  function exportCSV() {
    const header = 'Дата,Описание,Категория,Сумма\n'
    const rows = expenses.map((e) => `${e.date},"${e.description}",${e.category},${e.amount}`).join('\n')
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `расходы_${new Date().getFullYear()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!hydrated) return null

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 p-6 text-white shadow-lg shadow-rose-200">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-rose-200 text-sm font-medium">Расходы за 2026 год</span>
          </div>
          <div className="text-4xl font-bold tracking-tight mb-1">{formatRubles(total)}</div>
          <div className="text-rose-300 text-sm">
            Чистая прибыль:{' '}
            <span className={cn('font-bold', profit >= 0 ? 'text-white' : 'text-red-300')}>
              {formatRubles(profit)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <p className="text-rose-300 text-xs mb-0.5">Статей расходов</p>
              <p className="text-white font-bold text-lg">{yearExpenses.length}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <p className="text-rose-300 text-xs mb-0.5">% от доходов</p>
              <p className="text-white font-bold text-lg">{expenseRatio.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring subscriptions */}
      {recurring.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Repeat2 className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Регулярные расходы</p>
                <p className="text-[11px] text-gray-400">{recurring.length} подписок · {formatRubles(recurringTotal)}/мес</p>
              </div>
            </div>
            <span className="text-sm font-bold text-violet-700">{formatRubles(recurringTotal)}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recurring.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0', CAT_COLORS[e.category] ?? 'bg-gray-100 text-gray-600')}>
                  {e.category}
                </span>
                <p className="flex-1 text-sm text-gray-700 truncate">{e.description}</p>
                <p className="text-sm font-bold text-gray-900 shrink-0">{formatRubles(e.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* По категориям */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">По категориям</p>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const catTotal = yearExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0)
              if (catTotal === 0) return null
              const pct = total > 0 ? (catTotal / total) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full font-semibold', CAT_COLORS[cat])}>{cat}</span>
                    <span className="font-bold text-gray-700">{formatRubles(catTotal)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Список */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">Расходы</h3>
            {expenses.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">{expenses.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {expenses.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-3.5 h-3.5" />CSV
              </button>
            )}
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null) }}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all',
                showForm ? 'bg-gray-100 text-gray-600' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              {showForm ? 'Отмена' : 'Добавить'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="px-5 py-4 bg-rose-50/70 border-b border-rose-100 space-y-3">
            <input
              type="text"
              placeholder="Описание расхода"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addExpense()}
              autoFocus
              className="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-2.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Сумма"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                  className="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₽</span>
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="rounded accent-rose-600" />
              <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-rose-500" />Ежемесячный расход</span>
            </label>
            <div className="flex gap-2">
              <button onClick={addExpense} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors">
                Добавить расход
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {expenses.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Нет расходов</p>
              <p className="text-xs text-gray-400 mt-1">Добавьте первый расход</p>
            </div>
          )}

          {expenses.map((expense) => {
            if (editingId === expense.id) {
              return (
                <div key={expense.id} className="px-5 py-4 bg-rose-50/60 space-y-3">
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Редактирование</p>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex gap-2.5">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                    </div>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={editRecurring} onChange={(e) => setEditRecurring(e.target.checked)} className="rounded accent-rose-600" />
                    <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-rose-500" />Ежемесячный</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 flex-1 justify-center py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors">
                      <Check className="w-4 h-4" />Сохранить
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={expense.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
                <div className={cn('w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0', 'bg-rose-500')}>
                  <span className="text-[11px] font-bold text-white leading-none">{formatDate(expense.date).split(' ')[0]}</span>
                  <span className="text-[9px] text-white/80 uppercase leading-none mt-0.5">{formatDate(expense.date).split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{expense.description}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', CAT_COLORS[expense.category])}>
                      {expense.category}
                    </span>
                    {expense.recurring && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600">
                        <RefreshCw className="w-2.5 h-2.5" />ежемес.
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-rose-600 text-sm">{formatRubles(expense.amount)}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {expense.recurring && (
                    <button onClick={() => repeatExpense(expense)} title="Добавить за этот месяц" className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => startEdit(expense)} className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(expense.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
