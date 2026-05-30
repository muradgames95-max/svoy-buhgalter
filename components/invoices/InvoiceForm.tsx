'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
import {
  Invoice, InvoiceItem, calcInvoiceTotal, emptyItem, UNIT_OPTIONS,
} from '@/lib/invoices'

interface Client { id: string; name: string; inn?: string }
interface UserProfile { name?: string; inn?: string; executorStatus?: string; phone?: string; email?: string; bankName?: string; bik?: string; account?: string }

function todayStr() { return new Date().toISOString().split('T')[0] }
function dueDateStr() {
  const d = new Date(); d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function formatRub(n: number) {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
}

interface Props {
  invoice?: Invoice
  nextNumber: string
  onSave: (inv: Invoice) => void
  onClose: () => void
}

export default function InvoiceForm({ invoice, nextNumber, onSave, onClose }: Props) {
  const isEdit = !!invoice

  const [number, setNumber] = useState(invoice?.number ?? nextNumber)
  const [date, setDate] = useState(invoice?.date ?? todayStr())
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? dueDateStr())
  const [clientName, setClientName] = useState(invoice?.clientName ?? '')
  const [clientInn, setClientInn] = useState(invoice?.clientInn ?? '')
  const [clientAddress, setClientAddress] = useState(invoice?.clientAddress ?? '')
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items ?? [emptyItem()])
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [clients, setClients] = useState<Client[]>([])
  const [showClientDrop, setShowClientDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setClients(loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []))
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowClientDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pickClient(c: Client) {
    setClientName(c.name)
    setClientInn(c.inn ?? '')
    setShowClientDrop(false)
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: value } : it))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(id: string) {
    if (items.length === 1) return
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  function handleSave() {
    if (!clientName.trim() || items.every((it) => !it.description.trim())) return
    const inv: Invoice = {
      id: invoice?.id ?? Date.now().toString(),
      number: number.trim() || nextNumber,
      date,
      dueDate,
      clientName: clientName.trim(),
      clientInn: clientInn.trim(),
      clientAddress: clientAddress.trim(),
      items: items.filter((it) => it.description.trim()),
      notes: notes.trim(),
      status: invoice?.status ?? 'draft',
      createdAt: invoice?.createdAt ?? new Date().toISOString(),
    }
    onSave(inv)
  }

  const total = calcInvoiceTotal(items)

  const filteredClients = clients.filter((c) =>
    clientName ? c.name.toLowerCase().includes(clientName.toLowerCase()) : true
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[600px] lg:max-h-[90vh]">
        <div className="bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <span className="text-lg">📄</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">{isEdit ? 'Редактировать счёт' : 'Новый счёт'}</p>
              <p className="text-xs text-gray-400">{number}</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-5 space-y-4 flex-1">

            {/* Number + Dates */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Номер</label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Дата</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Оплатить до</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Клиент (кому выставляем)</label>
              <div className="relative" ref={dropRef}>
                <input
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setShowClientDrop(true) }}
                  onFocus={() => setShowClientDrop(true)}
                  placeholder="Имя или название компании"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {showClientDrop && filteredClients.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                    {filteredClients.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => pickClient(c)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.inn && <span className="text-gray-400 ml-2 text-xs">ИНН {c.inn}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <input
                  value={clientInn}
                  onChange={(e) => setClientInn(e.target.value)}
                  placeholder="ИНН клиента (необязательно)"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Адрес (необязательно)"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Услуги / Работы</label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder={`Услуга ${idx + 1}`}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-16 shrink-0">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="relative w-20 shrink-0">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-6"
                      >
                        {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="w-24 shrink-0 relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-2.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="mt-2 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Добавить строку
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Комментарий (необязательно)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="НДС не облагается (НПД). Оплата по реквизитам..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Total */}
            <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-indigo-700">Итого к оплате</p>
              <p className="text-xl font-black text-indigo-700">{formatRub(total)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!clientName.trim()}
              className={cn(
                'flex-1 py-3 rounded-2xl font-bold text-sm transition-colors',
                !clientName.trim()
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
              )}
            >
              {isEdit ? 'Сохранить' : 'Создать счёт'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
