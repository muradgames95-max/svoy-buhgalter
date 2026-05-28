'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Pencil, Check, X, Users, Search, Phone, Mail, Building2, User, ChevronDown, ChevronUp, FileText, TrendingUp, Upload, Download } from 'lucide-react'
import { cn, formatRubles } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'

interface Income { id: string; amount: number; isLegal: boolean; date: string; description: string; clientName?: string }

export interface Client {
  id: string
  name: string
  type: 'Физ. лицо' | 'ИП' | 'ООО'
  phone: string
  email: string
  notes: string
  createdAt: string
}

const CLIENT_TYPES: Client['type'][] = ['Физ. лицо', 'ИП', 'ООО']

const TYPE_COLORS: Record<Client['type'], string> = {
  'Физ. лицо': 'bg-sky-100 text-sky-700',
  'ИП': 'bg-violet-100 text-violet-700',
  'ООО': 'bg-emerald-100 text-emerald-700',
}

const TYPE_ICONS: Record<Client['type'], React.ElementType> = {
  'Физ. лицо': User,
  'ИП': Building2,
  'ООО': Building2,
}

const DEMO: Client[] = [
  { id: '1', name: 'Алексей Смирнов', type: 'Физ. лицо', phone: '+7 999 123-45-67', email: 'smirnov@example.com', notes: 'Постоянный клиент', createdAt: '2026-01-10' },
  { id: '2', name: 'ИП Петрова М.А.', type: 'ИП', phone: '+7 926 987-65-43', email: 'petrova@biz.ru', notes: 'Разработка сайтов', createdAt: '2026-02-03' },
  { id: '3', name: 'ООО «Медиалаб»', type: 'ООО', phone: '+7 495 600-12-34', email: 'info@medialab.ru', notes: 'Контент и дизайн', createdAt: '2026-02-18' },
  { id: '4', name: 'Дмитрий Волков', type: 'Физ. лицо', phone: '+7 916 234-56-78', email: 'volkov@mail.ru', notes: '', createdAt: '2026-03-01' },
  { id: '5', name: 'ИП Захаров К.Е.', type: 'ИП', phone: '+7 903 345-67-89', email: 'zakharov@gmail.com', notes: 'Рекламные кампании', createdAt: '2026-03-15' },
  { id: '6', name: 'ООО «Техноторг»', type: 'ООО', phone: '+7 812 700-55-00', email: 'office@technorg.ru', notes: 'Техническая документация', createdAt: '2026-04-07' },
  { id: '7', name: 'Наталья Орлова', type: 'Физ. лицо', phone: '+7 967 456-78-90', email: 'orlova.n@yandex.ru', notes: 'UX-аудит', createdAt: '2026-04-22' },
  { id: '8', name: 'ИП Кузнецов А.В.', type: 'ИП', phone: '+7 911 567-89-01', email: 'kuznetsov@biz.ru', notes: '', createdAt: '2026-05-05' },
]

const EMPTY_FORM = { name: '', type: 'Физ. лицо' as Client['type'], phone: '', email: '', notes: '' }

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setClients(loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, DEMO))
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, []))
    setHydrated(true)
  }, [])

  const incomeByClient = useMemo(() => {
    const map: Record<string, Income[]> = {}
    incomes.forEach((i) => {
      if (!i.clientName) return
      if (!map[i.clientName]) map[i.clientName] = []
      map[i.clientName].push(i)
    })
    return map
  }, [incomes])

  function save(next: Client[]) {
    setClients(next)
    saveToStorage(STORAGE_KEYS.CLIENTS, next)
  }

  function addClient() {
    if (!form.name.trim()) return
    save([...clients, {
      id: Date.now().toString(),
      name: form.name.trim(),
      type: form.type,
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    }])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  function remove(id: string) {
    if (editingId === id) setEditingId(null)
    save(clients.filter((c) => c.id !== id))
  }

  function startEdit(c: Client) {
    setEditingId(c.id)
    setEditForm({ name: c.name, type: c.type, phone: c.phone, email: c.email, notes: c.notes })
    setShowForm(false)
  }

  function saveEdit() {
    if (!editingId || !editForm.name.trim()) return
    save(clients.map((c) => c.id === editingId
      ? { ...c, name: editForm.name.trim(), type: editForm.type, phone: editForm.phone.trim(), email: editForm.email.trim(), notes: editForm.notes.trim() }
      : c
    ))
    setEditingId(null)
  }

  const filtered = clients.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    const header = 'Имя,Тип,Телефон,Email,Заметки\n'
    const rows = clients.map((c) =>
      `"${c.name}","${c.type}","${c.phone}","${c.email}","${c.notes}"`
    ).join('\n')
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'клиенты.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function importCSV(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string ?? '').replace(/^﻿/, '')
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) return
      const added: Client[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        const name = cols[0] ?? ''
        if (!name) continue
        const rawType = cols[1] ?? ''
        const type: Client['type'] = CLIENT_TYPES.includes(rawType as Client['type'])
          ? (rawType as Client['type'])
          : 'Физ. лицо'
        added.push({
          id: `import_${Date.now()}_${i}`,
          name,
          type,
          phone: cols[2] ?? '',
          email: cols[3] ?? '',
          notes: cols[4] ?? '',
          createdAt: new Date().toISOString().split('T')[0],
        })
      }
      if (added.length > 0) {
        const existing = new Set(clients.map((c) => c.name.toLowerCase()))
        const fresh = added.filter((c) => !existing.has(c.name.toLowerCase()))
        save([...clients, ...fresh])
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  const counts = CLIENT_TYPES.reduce((acc, t) => ({ ...acc, [t]: clients.filter((c) => c.type === t).length }), {} as Record<string, number>)

  if (!hydrated) return null

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 p-6 text-white shadow-lg shadow-sky-200">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-sky-200 text-sm font-medium">База клиентов</span>
          </div>
          <div className="text-4xl font-bold tracking-tight mb-1">{clients.length}</div>
          <p className="text-sky-300 text-sm">клиентов в базе</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {CLIENT_TYPES.map((t) => (
              <div key={t} className="bg-white/10 rounded-2xl px-3 py-3">
                <p className="text-sky-300 text-[10px] mb-0.5">{t}</p>
                <p className="text-white font-bold text-lg">{counts[t] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Поиск по имени, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {clients.length > 0 && (
              <button
                onClick={exportCSV}
                title="Экспорт CSV"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />CSV
              </button>
            )}
            <label
              title="Импорт CSV"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />Импорт
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { importCSV(f); e.target.value = '' } }}
              />
            </label>
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null) }}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all',
                showForm ? 'bg-gray-100 text-gray-600' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-200'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              {showForm ? 'Отмена' : 'Добавить'}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="px-5 py-4 bg-sky-50/70 border-b border-sky-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Имя / название"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
                className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Client['type'] })}
                className="rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {CLIENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input
                type="tel"
                placeholder="Телефон"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <input
              type="text"
              placeholder="Заметки (необязательно)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addClient()}
              className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex gap-2">
              <button onClick={addClient} className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors">
                Добавить клиента
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Client list */}
        <div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {search ? 'Клиенты не найдены' : 'Нет клиентов'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? 'Попробуйте другой запрос' : 'Добавьте первого клиента'}
              </p>
            </div>
          )}

          {filtered.map((client) => {
            if (editingId === client.id) {
              return (
                <div key={client.id} className="px-5 py-4 bg-sky-50/60 space-y-3">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Редактирование</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Client['type'] })}
                      className="rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {CLIENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Телефон"
                      className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                      className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Заметки"
                    className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 flex-1 justify-center py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors">
                      <Check className="w-4 h-4" />Сохранить
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            }

            const TypeIcon = TYPE_ICONS[client.type]
            const clientIncomes = incomeByClient[client.name] ?? []
            const clientTotal = clientIncomes.reduce((s, i) => s + i.amount, 0)
            const isExpanded = expandedId === client.id

            return (
              <div key={client.id} className="border-b border-gray-50 last:border-0">
                <div className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                    <TypeIcon className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', TYPE_COLORS[client.type])}>
                        {client.type}
                      </span>
                      {clientTotal > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                          {formatRubles(clientTotal)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {client.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />{client.phone}
                        </p>
                      )}
                      {client.email && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />{client.email}
                        </p>
                      )}
                      {client.notes && (
                        <p className="text-xs text-gray-400 italic">{client.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                    {clientIncomes.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                        className="p-1.5 text-gray-300 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Доходы по клиенту"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => startEdit(client)} className="p-1.5 text-gray-300 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(client.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Revenue detail panel */}
                {isExpanded && clientIncomes.length > 0 && (
                  <div className="px-5 pb-4 bg-sky-50/40 border-t border-sky-100">
                    {/* Summary row */}
                    <div className="flex items-center justify-between py-3 border-b border-sky-100/60 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-semibold text-sky-700">
                          {clientIncomes.length} {clientIncomes.length === 1 ? 'платёж' : clientIncomes.length < 5 ? 'платежа' : 'платежей'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-sky-800">{formatRubles(clientTotal)}</span>
                        <a
                          href={`/documents?client=${encodeURIComponent(client.name)}`}
                          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          Счёт
                        </a>
                      </div>
                    </div>

                    {/* Income entries */}
                    <div className="space-y-1.5">
                      {[...clientIncomes]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((inc) => (
                          <div key={inc.id} className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 truncate">{inc.description || 'Без описания'}</p>
                              <p className="text-[10px] text-gray-400">{inc.date}</p>
                            </div>
                            <p className="text-xs font-semibold text-emerald-700 shrink-0">{formatRubles(inc.amount)}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
