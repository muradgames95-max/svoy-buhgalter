'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, TrendingUp, ShoppingBag, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'

interface Income { id: string; description: string; amount: number; isLegal: boolean; date: string; clientId?: string; clientName?: string }
interface Expense { id: string; description: string; amount: number; category: string; date: string }
interface Client { id: string; name: string; type: string }

const EXPENSE_CATEGORIES = ['Офис', 'Транспорт', 'Маркетинг', 'Оборудование', 'Связь', 'Услуги', 'Прочее']

type Mode = null | 'menu' | 'income' | 'expense'

export default function QuickAdd() {
  const [mode, setMode] = useState<Mode>(null)
  const [saved, setSaved] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  const [incomeForm, setIncomeForm] = useState({ description: '', amount: '', isLegal: false, clientId: '' })
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Прочее' })

  const descRef = useRef<HTMLInputElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [])

  useEffect(() => {
    setClients(loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []))
  }, [])

  useEffect(() => {
    if (mode === 'income' || mode === 'expense') {
      setTimeout(() => descRef.current?.focus(), 50)
    }
  }, [mode])

  function handleFab() {
    setMode(mode === null ? 'menu' : null)
  }

  function close() {
    setMode(null)
    setSaved(false)
    setIncomeForm({ description: '', amount: '', isLegal: false, clientId: '' })
    setExpenseForm({ description: '', amount: '', category: 'Прочее' })
  }

  function saveIncome() {
    const amount = parseFloat(incomeForm.amount.replace(/\s/g, '').replace(',', '.'))
    if (!incomeForm.description.trim() || isNaN(amount) || amount <= 0) return
    const client = clients.find((c) => c.id === incomeForm.clientId)
    const incomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
    const next: Income[] = [...incomes, {
      id: Date.now().toString(),
      description: incomeForm.description.trim(),
      amount,
      isLegal: incomeForm.isLegal,
      date: new Date().toISOString().split('T')[0],
      clientId: client?.id,
      clientName: client?.name,
    }]
    saveToStorage(STORAGE_KEYS.INCOMES, next)
    window.dispatchEvent(new CustomEvent('svoy-storage-updated'))
    setSaved(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(close, 1200)
  }

  function saveExpense() {
    const amount = parseFloat(expenseForm.amount.replace(/\s/g, '').replace(',', '.'))
    if (!expenseForm.description.trim() || isNaN(amount) || amount <= 0) return
    const expenses = loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, [])
    const next: Expense[] = [...expenses, {
      id: Date.now().toString(),
      description: expenseForm.description.trim(),
      amount,
      category: expenseForm.category,
      date: new Date().toISOString().split('T')[0],
    }]
    saveToStorage(STORAGE_KEYS.EXPENSES, next)
    window.dispatchEvent(new CustomEvent('svoy-storage-updated'))
    setSaved(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(close, 1200)
  }

  const isIncome = mode === 'income'
  const isExpense = mode === 'expense'
  const isForm = isIncome || isExpense

  return (
    <>
      {/* Backdrop */}
      {mode !== null && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Menu popup */}
      {mode === 'menu' && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 items-end">
          <button
            onClick={() => setMode('income')}
            className="flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-300 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            Добавить доход
          </button>
          <button
            onClick={() => setMode('expense')}
            className="flex items-center gap-2.5 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-rose-300 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Добавить расход
          </button>
        </div>
      )}

      {/* Form modal */}
      {isForm && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[420px]">
          <div className={cn(
            'rounded-t-3xl lg:rounded-3xl shadow-2xl p-6',
            isIncome ? 'bg-white' : 'bg-white'
          )}>
            {/* Header */}
            <div className={cn(
              'flex items-center gap-3 mb-5',
            )}>
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center',
                isIncome ? 'bg-indigo-100' : 'bg-rose-100'
              )}>
                {isIncome
                  ? <TrendingUp className="w-5 h-5 text-indigo-600" />
                  : <ShoppingBag className="w-5 h-5 text-rose-600" />
                }
              </div>
              <div>
                <p className="font-bold text-gray-900">{isIncome ? 'Быстрый доход' : 'Быстрый расход'}</p>
                <p className="text-xs text-gray-400">{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={close} className="ml-auto p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {saved ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="font-bold text-gray-900">Сохранено!</p>
              </div>
            ) : isIncome ? (
              <div className="space-y-3">
                <input
                  ref={descRef}
                  type="text"
                  placeholder="Описание работы или услуги"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && saveIncome()}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <div className="flex gap-2.5">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Сумма"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && saveIncome()}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white pr-8"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer border border-gray-200 rounded-2xl px-3.5 py-3 whitespace-nowrap bg-gray-50">
                    <input
                      type="checkbox"
                      checked={incomeForm.isLegal}
                      onChange={(e) => setIncomeForm({ ...incomeForm, isLegal: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    Юрлицо
                  </label>
                </div>
                {clients.length > 0 && (
                  <div className="relative">
                    <select
                      value={incomeForm.clientId}
                      onChange={(e) => setIncomeForm({ ...incomeForm, clientId: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-9"
                    >
                      <option value="">Клиент (необязательно)</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                <button
                  onClick={saveIncome}
                  disabled={!incomeForm.description.trim() || !incomeForm.amount}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-colors shadow-sm shadow-indigo-200"
                >
                  Сохранить доход
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  ref={descRef}
                  type="text"
                  placeholder="Описание расхода"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && saveExpense()}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <div className="flex gap-2.5">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Сумма"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && saveExpense()}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white pr-8"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                  </div>
                  <div className="relative">
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="h-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none pr-8"
                    >
                      {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={saveExpense}
                  disabled={!expenseForm.description.trim() || !expenseForm.amount}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-colors shadow-sm shadow-rose-200"
                >
                  Сохранить расход
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={handleFab}
        className={cn(
          'fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200',
          mode !== null
            ? 'bg-gray-800 hover:bg-gray-700 rotate-45 shadow-gray-400/30'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-300/60 hover:scale-110'
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </>
  )
}
