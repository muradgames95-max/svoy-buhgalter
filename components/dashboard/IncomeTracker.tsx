'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, TrendingUp, Receipt, AlertCircle, Download, Pencil, Check, X, Wallet, ArrowUpRight, Search, AlertTriangle, UserCircle } from 'lucide-react'
import { cn, formatRubles, calculateNPDTax } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'

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

interface Client {
  id: string
  name: string
  type: string
}

const NPD_LIMIT = 2_400_000
const MONTH_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

const DEMO: Income[] = [
  { id: '1', description: 'Разработка сайта', amount: 85000, isLegal: false, date: '2026-05-01' },
  { id: '2', description: 'Консультация по SEO', amount: 25000, isLegal: true, date: '2026-05-10' },
  { id: '3', description: 'Дизайн логотипа', amount: 40000, isLegal: false, date: '2026-04-15' },
]

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTH_SHORT[parseInt(m) - 1]}`
}

export default function IncomeTracker() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [form, setForm] = useState({ description: '', amount: '', isLegal: false, clientId: '', recurring: false })
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editIsLegal, setEditIsLegal] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [receiptState, setReceiptState] = useState<Record<string, 'loading' | 'ok' | 'error'>>({})
  const [nalogConnected, setNalogConnected] = useState(false)

  useEffect(() => {
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, DEMO))
    setClients(loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []))
    setHydrated(true)
    setSelectedMonth(new Date().getMonth() + 1)
    const creds = localStorage.getItem('sb_nalog_creds')
    if (creds) {
      try { setNalogConnected(!!JSON.parse(creds)?.token) } catch { /* ignore */ }
    }
  }, [])

  function updateIncomes(next: Income[]) {
    setIncomes(next)
    saveToStorage(STORAGE_KEYS.INCOMES, next)
  }

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1

  const yearIncomes = useMemo(() =>
    incomes.filter((i) => parseInt(i.date.split('-')[0]) === currentYear),
    [incomes]
  )

  const totalIncome = yearIncomes.reduce((s, i) => s + i.amount, 0)
  const totalTax = yearIncomes.reduce((s, i) => s + calculateNPDTax(i.amount, i.isLegal), 0)
  const remaining = NPD_LIMIT - totalIncome
  const usagePercent = Math.min((totalIncome / NPD_LIMIT) * 100, 100)
  const netIncome = totalIncome - totalTax

  // Monthly data
  const monthsWithData = useMemo(() => {
    const set = new Set(incomes.map((i) => parseInt(i.date.split('-')[1])))
    return Array.from(set).sort((a, b) => a - b)
  }, [incomes])

  const thisMonthTotal = useMemo(() =>
    yearIncomes.filter((i) => parseInt(i.date.split('-')[1]) === currentMonth).reduce((s, i) => s + i.amount, 0),
    [yearIncomes, currentMonth]
  )
  const prevMonthTotal = useMemo(() =>
    yearIncomes.filter((i) => parseInt(i.date.split('-')[1]) === prevMonth).reduce((s, i) => s + i.amount, 0),
    [yearIncomes, prevMonth]
  )
  const monthDelta = prevMonthTotal > 0 ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0

  // Filtered list
  const filtered = useMemo(() => {
    return incomes.filter((i) => {
      const matchMonth = selectedMonth === null || parseInt(i.date.split('-')[1]) === selectedMonth
      const matchSearch = !search || i.description.toLowerCase().includes(search.toLowerCase())
      return matchMonth && matchSearch
    })
  }, [incomes, selectedMonth, search])

  function addIncome() {
    const amount = parseFloat(form.amount.replace(/\s/g, '').replace(',', '.'))
    if (!form.description.trim() || isNaN(amount) || amount <= 0) return
    const client = clients.find((c) => c.id === form.clientId)
    updateIncomes([...incomes, {
      id: Date.now().toString(),
      description: form.description.trim(),
      amount,
      isLegal: form.isLegal,
      date: new Date().toISOString().split('T')[0],
      clientId: client?.id,
      clientName: client?.name,
      recurring: form.recurring,
    }])
    setForm({ description: '', amount: '', isLegal: false, clientId: '', recurring: false })
    setShowForm(false)
  }

  function removeIncome(id: string) {
    if (editingId === id) setEditingId(null)
    updateIncomes(incomes.filter((i) => i.id !== id))
  }

  function startEdit(income: Income) {
    setEditingId(income.id)
    setEditDesc(income.description)
    setEditAmount(String(income.amount))
    setEditIsLegal(income.isLegal)
    setShowForm(false)
  }

  function saveEdit() {
    if (!editingId) return
    const amount = parseFloat(editAmount.replace(/\s/g, '').replace(',', '.'))
    if (!editDesc.trim() || isNaN(amount) || amount <= 0) return
    updateIncomes(incomes.map((i) =>
      i.id === editingId ? { ...i, description: editDesc.trim(), amount, isLegal: editIsLegal } : i
    ))
    setEditingId(null)
  }

  async function sendReceipt(income: Income) {
    const raw = localStorage.getItem('sb_nalog_creds')
    if (!raw) return
    let creds: { token?: string; inn?: string }
    try { creds = JSON.parse(raw) } catch { return }
    if (!creds.token || !creds.inn) return

    setReceiptState((s) => ({ ...s, [income.id]: 'loading' }))
    const profile = loadFromStorage<{ clientInn?: string }>(STORAGE_KEYS.PROFILE, {})
    const res = await fetch('/api/nalog/receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: income.amount,
        description: income.description,
        isLegal: income.isLegal,
        clientName: income.clientName,
        clientInn: income.isLegal ? profile.clientInn : undefined,
        nalogToken: creds.token,
        nalogInn: creds.inn,
      }),
    })
    setReceiptState((s) => ({ ...s, [income.id]: res.ok ? 'ok' : 'error' }))
    setTimeout(() => setReceiptState((s) => { const n = { ...s }; delete n[income.id]; return n }), 3000)
  }

  function exportCSV() {
    const header = 'Дата,Описание,Сумма,Тип,Налог\n'
    const rows = incomes.map((i) => {
      const tax = calculateNPDTax(i.amount, i.isLegal)
      return `${i.date},"${i.description}",${i.amount},${i.isLegal ? 'Юрлицо (6%)' : 'Физлицо (4%)'},${tax}`
    }).join('\n')
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `доходы_2026.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!hydrated) return null

  const isCritical = usagePercent >= 90
  const isWarning = usagePercent >= 75 && usagePercent < 90

  return (
    <div className="space-y-4 pt-2">

      {/* Critical NPD alert */}
      {isCritical && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Лимит НПД почти исчерпан!</p>
            <p className="text-xs text-red-600 mt-0.5">
              Использовано {usagePercent.toFixed(1)}% от 2,4 млн. Осталось {formatRubles(Math.max(remaining, 0))}. Срочно проконсультируйтесь о переходе на ИП.
            </p>
          </div>
        </div>
      )}

      {isWarning && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-700">Внимание: {usagePercent.toFixed(1)}% лимита НПД</p>
            <p className="text-xs text-amber-600 mt-0.5">
              До лимита осталось {formatRubles(remaining)}. Заранее изучите вариант перехода на ИП.
            </p>
          </div>
        </div>
      )}

      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-lg shadow-indigo-200">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-indigo-200 text-sm font-medium">Доход за 2026 год</span>
          </div>
          <div className="text-4xl font-bold tracking-tight mb-1">{formatRubles(totalIncome)}</div>
          <div className="flex items-center gap-1 text-indigo-300 text-sm">
            <ArrowUpRight className="w-3.5 h-3.5" />
            На руки: <span className="text-white font-semibold ml-1">{formatRubles(netIncome)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-5">
            <div className="bg-white/10 rounded-2xl px-3 py-3">
              <p className="text-indigo-300 text-[10px] mb-0.5">Налог НПД</p>
              <p className="text-white font-bold text-sm">{formatRubles(totalTax)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-3">
              <p className="text-indigo-300 text-[10px] mb-0.5">Этот месяц</p>
              <p className="text-white font-bold text-sm">{formatRubles(thisMonthTotal)}</p>
              {prevMonthTotal > 0 && (
                <p className={cn('text-[9px] mt-0.5', monthDelta >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                  {monthDelta >= 0 ? '↑' : '↓'}{Math.abs(monthDelta).toFixed(0)}% vs прошлый
                </p>
              )}
            </div>
            <div className={cn(
              'rounded-2xl px-3 py-3',
              remaining <= 0 ? 'bg-red-500/30' : remaining < 500_000 ? 'bg-amber-400/20' : 'bg-white/10'
            )}>
              <p className="text-indigo-300 text-[10px] mb-0.5">Остаток лимита</p>
              <p className={cn('font-bold text-sm', remaining <= 0 ? 'text-red-300' : remaining < 500_000 ? 'text-amber-300' : 'text-white')}>
                {remaining <= 0 ? 'Исчерпан' : formatRubles(remaining)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2.5">
          <p className="text-sm font-semibold text-gray-800">Лимит НПД 2,4 млн</p>
          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full',
            isCritical ? 'bg-red-100 text-red-700'
            : isWarning ? 'bg-amber-100 text-amber-700'
            : 'bg-indigo-100 text-indigo-700'
          )}>
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${usagePercent}%`,
              background: isCritical
                ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                : isWarning
                ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{formatRubles(totalIncome)} из {formatRubles(NPD_LIMIT)}</p>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">Доходы</h3>
            {incomes.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">{incomes.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {incomes.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-3.5 h-3.5" />CSV
              </button>
            )}
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null) }}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all',
                showForm ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              {showForm ? 'Отмена' : 'Добавить'}
            </button>
          </div>
        </div>

        {/* Search + month filter */}
        {incomes.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по описанию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedMonth(null)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  selectedMonth === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                Все
              </button>
              {monthsWithData.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize',
                    selectedMonth === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {MONTH_SHORT[m - 1]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="px-5 py-4 bg-indigo-50/70 border-b border-indigo-100 space-y-3">
            <input
              type="text"
              placeholder="Описание — напр. «Разработка лендинга»"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addIncome()}
              autoFocus
              className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Сумма"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addIncome()}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₽</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 whitespace-nowrap">
                <input type="checkbox" checked={form.isLegal} onChange={(e) => setForm({ ...form, isLegal: e.target.checked })} className="rounded accent-indigo-600" />
                Юрлицо
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 whitespace-nowrap">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="rounded accent-violet-600" />
                Регулярный
              </label>
            </div>
            {clients.length > 0 && (
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="">Клиент (необязательно)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <button onClick={addIncome} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                Добавить доход
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {search || selectedMonth !== null ? 'Ничего не найдено' : 'Нет записей'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? 'Попробуйте другой запрос' : selectedMonth !== null ? 'В этом месяце нет доходов' : 'Нажмите «Добавить»'}
              </p>
            </div>
          )}

          {filtered.map((income) => {
            if (editingId === income.id) {
              return (
                <div key={income.id} className="px-5 py-4 bg-indigo-50/60 space-y-3">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Редактирование</p>
                  <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="flex gap-2.5">
                    <div className="flex-1 relative">
                      <input type="text" inputMode="decimal" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 whitespace-nowrap">
                      <input type="checkbox" checked={editIsLegal} onChange={(e) => setEditIsLegal(e.target.checked)} className="rounded accent-indigo-600" />
                      Юрлицо
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 flex-1 justify-center py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                      <Check className="w-4 h-4" />Сохранить
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            }

            const tax = calculateNPDTax(income.amount, income.isLegal)
            return (
              <div key={income.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
                <div className={cn('w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white shrink-0',
                  income.isLegal ? 'bg-emerald-500' : 'bg-indigo-500')}>
                  <span className="text-[11px] font-bold leading-none">{formatDate(income.date).split(' ')[0]}</span>
                  <span className="text-[9px] uppercase opacity-80 leading-none mt-0.5">{formatDate(income.date).split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{income.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block',
                      income.isLegal ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700')}>
                      {income.isLegal ? 'Юрлицо · 6%' : 'Физлицо · 4%'}
                    </span>
                    {income.clientName && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">
                        <UserCircle className="w-2.5 h-2.5" />
                        {income.clientName}
                      </span>
                    )}
                    {income.recurring && (
                      <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md">
                        ↻ Регулярный
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-sm">{formatRubles(income.amount)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">налог {formatRubles(tax)}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {nalogConnected && (
                    <button
                      onClick={() => sendReceipt(income)}
                      disabled={receiptState[income.id] === 'loading'}
                      title="Выдать чек в Мой налог"
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        receiptState[income.id] === 'ok' ? 'text-emerald-500 bg-emerald-50'
                        : receiptState[income.id] === 'error' ? 'text-red-400 bg-red-50'
                        : receiptState[income.id] === 'loading' ? 'text-violet-400 bg-violet-50'
                        : 'text-gray-300 hover:text-violet-500 hover:bg-violet-50'
                      )}
                    >
                      {receiptState[income.id] === 'loading' ? (
                        <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin block" />
                      ) : receiptState[income.id] === 'ok' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Receipt className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button onClick={() => startEdit(income)} className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeIncome(income.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
