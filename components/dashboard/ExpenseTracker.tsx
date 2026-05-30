'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Download, Pencil, Check, X, ShoppingBag, RefreshCw, Repeat2, Settings2, Upload, Search, AlertCircle } from 'lucide-react'
import { cn, formatRubles } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import { autoAddRecurring } from '@/lib/recurring'

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

const FREE_ENTRY_LIMIT = 50
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
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ description: '', amount: '', category: 'Прочее', recurring: false, date: today })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('Прочее')
  const [editRecurring, setEditRecurring] = useState(false)
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [showBudgetEditor, setShowBudgetEditor] = useState(false)
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({})
  const [importError, setImportError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [showLimitModal, setShowLimitModal] = useState(false)

  useEffect(() => {
    function loadData() {
      setExpenses(loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, DEMO))
      const b = loadFromStorage<Record<string, number>>(STORAGE_KEYS.EXPENSE_BUDGETS, {})
      setBudgets(b)
      const inputs: Record<string, string> = {}
      CATEGORIES.forEach((c) => { inputs[c] = b[c] ? String(b[c]) : '' })
      setBudgetInputs(inputs)
    }
    autoAddRecurring<Expense>(STORAGE_KEYS.EXPENSES, (_item, dateStr) => ({ date: dateStr }))
    loadData()
    setHydrated(true)
    fetch('/api/subscription').then((r) => r.json()).then((d) => setUserPlan(d.plan ?? 'free')).catch(() => null)
    window.addEventListener('svoy-storage-updated', loadData)
    return () => window.removeEventListener('svoy-storage-updated', loadData)
  }, [])

  useEffect(() => {
    function openForm() { setShowForm(true); setEditingId(null) }
    window.addEventListener('sb:open-add-expense', openForm)
    return () => window.removeEventListener('sb:open-add-expense', openForm)
  }, [])

  function save(next: Expense[]) {
    setExpenses(next)
    saveToStorage(STORAGE_KEYS.EXPENSES, next)
    window.dispatchEvent(new CustomEvent('svoy-storage-updated'))
  }

  const currentYear = new Date().getFullYear()
  const yearExpenses = useMemo(() =>
    expenses.filter((e) => parseInt(e.date.split('-')[0]) === currentYear),
    [expenses, currentYear]
  )

  const total = yearExpenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalIncome - total
  const expenseRatio = totalIncome > 0 ? Math.min((total / totalIncome) * 100, 100) : 0
  const recurring = expenses.filter((e) => e.recurring)
  const recurringTotal = recurring.reduce((s, e) => s + e.amount, 0)

  const monthsWithData = useMemo(() => {
    const set = new Set(expenses.map((e) => parseInt(e.date.split('-')[1])))
    return Array.from(set).sort((a, b) => a - b)
  }, [expenses])

  const filtered = useMemo(() =>
    expenses
      .filter((e) => {
        const matchMonth = selectedMonth === null || parseInt(e.date.split('-')[1]) === selectedMonth
        const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
        return matchMonth && matchSearch
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedMonth, search]
  )

  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered])

  function handleShowForm() {
    if (userPlan === 'free' && expenses.length >= FREE_ENTRY_LIMIT) {
      setShowLimitModal(true)
      return
    }
    setShowForm(!showForm)
    setEditingId(null)
  }

  function addExpense() {
    if (userPlan === 'free' && expenses.length >= FREE_ENTRY_LIMIT) {
      setShowLimitModal(true)
      return
    }
    const amount = parseFloat(form.amount.replace(/\s/g, '').replace(',', '.'))
    if (!form.description.trim() || isNaN(amount) || amount <= 0) return
    save([...expenses, {
      id: Date.now().toString(),
      description: form.description.trim(),
      amount,
      category: form.category,
      recurring: form.recurring,
      date: form.date || new Date().toISOString().split('T')[0],
    }])
    setForm({ description: '', amount: '', category: 'Прочее', recurring: false, date: today })
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

  function saveBudgets() {
    const result: Record<string, number> = {}
    CATEGORIES.forEach((c) => {
      const v = parseFloat(budgetInputs[c]?.replace(/\s/g, '').replace(',', '.') ?? '')
      if (!isNaN(v) && v > 0) result[c] = v
    })
    setBudgets(result)
    saveToStorage(STORAGE_KEYS.EXPENSE_BUDGETS, result)
    setShowBudgetEditor(false)
  }

  function importCSV(file: File) {
    setImportError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).replace(/^﻿/, '')
        const lines = text.split('\n').filter(Boolean)
        const dataLines = lines[0]?.toLowerCase().includes('дата') || lines[0]?.toLowerCase().includes('date') ? lines.slice(1) : lines
        const parsed: Expense[] = []
        for (const line of dataLines) {
          const cols = line.split(',').map((s) => s.replace(/^"(.*)"$/, '$1').trim())
          const date = cols[0] ?? ''
          const description = cols[1] ?? ''
          const categoryRaw = cols[2] ?? 'Прочее'
          const amount = parseFloat(cols[3] ?? '0')
          if (!date || !description || isNaN(amount) || amount <= 0) continue
          const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : 'Прочее'
          parsed.push({ id: Date.now().toString() + Math.random(), description, amount, category, date })
        }
        if (parsed.length === 0) { setImportError('Не удалось распознать данные CSV'); return }
        save([...expenses, ...parsed])
      } catch {
        setImportError('Ошибка чтения файла')
      }
    }
    reader.readAsText(file, 'utf-8')
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">По категориям</p>
            <button
              onClick={() => setShowBudgetEditor(!showBudgetEditor)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-600 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Бюджеты
            </button>
          </div>

          {showBudgetEditor && (
            <div className="mb-4 p-3 bg-rose-50 rounded-xl space-y-2">
              <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide">Лимит на месяц (₽)</p>
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 w-28 text-center', CAT_COLORS[cat] ?? 'bg-gray-100 text-gray-600')}>{cat}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="без лимита"
                    value={budgetInputs[cat] ?? ''}
                    onChange={(e) => setBudgetInputs({ ...budgetInputs, [cat]: e.target.value })}
                    className="flex-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={saveBudgets} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors">
                  Сохранить
                </button>
                <button onClick={() => setShowBudgetEditor(false)} className="px-4 py-2 text-gray-500 rounded-xl text-xs hover:bg-gray-100 transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {CATEGORIES.map((cat) => {
              const catTotal = yearExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0)
              if (catTotal === 0 && !budgets[cat]) return null
              const pct = total > 0 ? (catTotal / total) * 100 : 0
              const budget = budgets[cat]
              const budgetPct = budget ? Math.min((catTotal / budget) * 100, 100) : null
              const overBudget = budget ? catTotal > budget : false
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full font-semibold', CAT_COLORS[cat])}>{cat}</span>
                    <span className={cn('font-bold', overBudget ? 'text-red-600' : 'text-gray-700')}>
                      {formatRubles(catTotal)}
                      {budget ? <span className="text-gray-400 font-normal"> / {formatRubles(budget)}</span> : ''}
                    </span>
                  </div>
                  {budgetPct !== null ? (
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', overBudget ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-rose-500 to-pink-500')}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
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
            <label title="Импорт CSV" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = '' }} />
            </label>
            {expenses.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-3.5 h-3.5" />CSV
              </button>
            )}
            <button
              onClick={handleShowForm}
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

        {importError && (
          <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">{importError}</div>
        )}

        {expenses.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по описанию или категории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            {monthsWithData.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', selectedMonth === null ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                >
                  Все
                </button>
                {monthsWithData.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', selectedMonth === m ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                  >
                    {MONTH_SHORT[m - 1]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer flex-1">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="rounded accent-rose-600" />
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-rose-500" />Ежемесячный расход</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-700"
              />
            </div>
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

          {expenses.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <Search className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-500">Ничего не найдено</p>
              <p className="text-xs text-gray-400 mt-1">Попробуйте другой запрос</p>
            </div>
          )}

          {filtered.length > 1 && (
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
              <span className="text-[11px] font-medium text-gray-400">{filtered.length} записей</span>
              <span className="text-[11px] font-bold text-rose-600">{formatRubles(filteredTotal)}</span>
            </div>
          )}

          {filtered.map((expense) => {
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

      {/* Plan limit modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Лимит бесплатного плана</h2>
            <p className="text-sm text-gray-500 mb-5">
              На бесплатном тарифе можно хранить до {FREE_ENTRY_LIMIT} расходов. Перейдите на платный план, чтобы добавлять неограниченно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Закрыть
              </button>
              <a
                href="/pricing"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Тарифы →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
