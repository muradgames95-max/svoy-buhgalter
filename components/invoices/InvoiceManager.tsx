'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, FileText, ExternalLink, Trash2, CheckCircle2, Send, Clock, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import {
  Invoice, calcInvoiceTotal, nextInvoiceNumber,
  STATUS_LABELS, STATUS_COLORS,
} from '@/lib/invoices'
import InvoiceForm from './InvoiceForm'

function formatRub(n: number) {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
}

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setInvoices(loadFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []))
    setHydrated(true)
  }, [])

  function save(list: Invoice[]) {
    setInvoices(list)
    saveToStorage(STORAGE_KEYS.INVOICES, list)
  }

  function handleCreate(inv: Invoice) {
    save([...invoices, inv])
    setShowForm(false)
  }

  function handleUpdate(inv: Invoice) {
    save(invoices.map((i) => i.id === inv.id ? inv : i))
    setEditInvoice(null)
  }

  function deleteInvoice(id: string) {
    save(invoices.filter((i) => i.id !== id))
  }

  function setStatus(id: string, status: Invoice['status']) {
    save(invoices.map((i) => i.id === id ? { ...i, status } : i))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return invoices
      .filter((i) => !q || i.clientName.toLowerCase().includes(q) || i.number.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [invoices, search])

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + calcInvoiceTotal(i.items), 0),
    pending: invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + calcInvoiceTotal(i.items), 0),
    draft: invoices.filter((i) => i.status === 'draft').length,
  }), [invoices])

  const nextNumber = useMemo(() => nextInvoiceNumber(invoices), [invoices])

  if (!hydrated) return <div className="min-h-screen bg-gray-50" />

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">Счета</h1>
            <p className="text-sm text-gray-400 mt-0.5">Выставляй счета клиентам и следи за оплатой</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-indigo-200 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Новый счёт
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Оплачено</p>
            <p className="text-lg font-black text-emerald-600">{formatRub(stats.paid)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Ожидает</p>
            <p className="text-lg font-black text-amber-600">{formatRub(stats.pending)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Черновики</p>
            <p className="text-lg font-black text-gray-700">{stats.draft}</p>
          </div>
        </div>

        {/* Search */}
        {invoices.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по клиенту или номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Empty state */}
        {invoices.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="font-bold text-gray-900 mb-1">Счетов пока нет</p>
            <p className="text-sm text-gray-400 mb-5">Создай первый счёт и отправь клиенту прямо из приложения</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Создать первый счёт
            </button>
          </div>
        )}

        {/* List */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((inv) => {
              const total = calcInvoiceTotal(inv.items)
              return (
                <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-gray-900 text-sm">{inv.number}</span>
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[inv.status])}>
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{inv.clientName || 'Без клиента'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{inv.date.split('-').reverse().join('.')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-900">{formatRub(total)}</p>
                      <p className="text-xs text-gray-400">{inv.items.length} поз.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <Link
                      href={`/invoices/${inv.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Открыть / PDF
                    </Link>

                    {inv.status === 'draft' && (
                      <button
                        onClick={() => setStatus(inv.id, 'sent')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Отправлен
                      </button>
                    )}
                    {inv.status === 'sent' && (
                      <button
                        onClick={() => setStatus(inv.id, 'paid')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Оплачен
                      </button>
                    )}
                    {inv.status === 'paid' && (
                      <button
                        onClick={() => setStatus(inv.id, 'sent')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-semibold transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Не оплачен
                      </button>
                    )}

                    <button
                      onClick={() => { setEditInvoice(inv); setShowForm(false) }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-semibold transition-colors"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      className="p-1.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <InvoiceForm
          nextNumber={nextNumber}
          onSave={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editInvoice && (
        <InvoiceForm
          invoice={editInvoice}
          nextNumber={editInvoice.number}
          onSave={handleUpdate}
          onClose={() => setEditInvoice(null)}
        />
      )}
    </div>
  )
}
