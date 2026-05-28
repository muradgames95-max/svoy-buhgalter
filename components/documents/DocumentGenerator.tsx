'use client'

import { useState, useEffect } from 'react'
import { FileText, Scroll, Receipt, Loader2, Copy, Download, Check, ChevronRight, ArrowLeft, Printer, Users, UserCircle, Mail, Send, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import type { Client } from '@/components/clients/ClientManager'
import type { UserProfile } from '@/components/profile/ProfileEditor'

type DocType = 'act' | 'contract' | 'invoice'

interface SavedDoc {
  id: string
  type: DocType
  title: string
  clientName: string
  amount: string
  date: string
  content: string
  createdAt: string
  paid?: boolean
  paidAt?: string
}

const DOC_TYPES = [
  {
    id: 'act' as DocType,
    icon: Check,
    title: 'Акт выполненных работ',
    desc: 'Подтверждение выполнения услуг',
    gradient: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'contract' as DocType,
    icon: Scroll,
    title: 'Договор оказания услуг',
    desc: 'С защитой от переквалификации',
    gradient: 'from-indigo-600 to-violet-600',
  },
  {
    id: 'invoice' as DocType,
    icon: Receipt,
    title: 'Счёт на оплату',
    desc: 'С реквизитами и НДС-пометкой',
    gradient: 'from-violet-600 to-purple-600',
  },
]

const STATUS_OPTIONS = ['Самозанятый (НПД)', 'ИП на УСН', 'ИП на ОСНО', 'ООО']

interface FormData {
  executorName: string
  executorInn: string
  executorStatus: string
  clientName: string
  clientInn: string
  description: string
  amount: string
  date: string
  docNumber: string
  deadline: string
  bankName: string
  bik: string
  account: string
  quantity: string
}

const EMPTY_FORM: FormData = {
  executorName: '', executorInn: '', executorStatus: 'Самозанятый (НПД)',
  clientName: '', clientInn: '', description: '', amount: '',
  date: new Date().toISOString().split('T')[0],
  docNumber: '1', deadline: '', bankName: '', bik: '', account: '', quantity: '1',
}

export default function DocumentGenerator() {
  const [docType, setDocType] = useState<DocType>('act')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<'select' | 'form' | 'result'>('select')
  const [clients, setClients] = useState<Client[]>([])
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<'ok' | 'error' | null>(null)

  useEffect(() => {
    setClients(loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []))
    setSavedDocs(loadFromStorage<SavedDoc[]>(STORAGE_KEYS.DOCUMENTS, []))
    // Pre-fill executor from profile
    const profile = loadFromStorage<Partial<UserProfile>>(STORAGE_KEYS.PROFILE, {})
    if (profile.name || profile.inn) {
      setForm((f) => ({
        ...f,
        executorName: profile.name ?? f.executorName,
        executorInn: profile.inn ?? f.executorInn,
        executorStatus: profile.executorStatus ?? f.executorStatus,
        bankName: profile.bankName ?? f.bankName,
        bik: profile.bik ?? f.bik,
        account: profile.account ?? f.account,
      }))
    }
  }, [])

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function pickClient(client: Client) {
    setForm((f) => ({ ...f, clientName: client.name, clientInn: '' }))
    setShowClientPicker(false)
  }

  async function generate() {
    setLoading(true)
    setResult('')
    setLimitError(null)
    setStep('result')
    let full = ''
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: docType, data: form }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json() as { message?: string }
          setLimitError(data.message ?? 'Лимит документов исчерпан. Оформите подписку.')
        } else if (res.status === 401) {
          setLimitError('Необходимо войти в аккаунт.')
        } else {
          full = 'Ошибка генерации. Попробуйте позже.'
          setResult(full)
        }
        setLoading(false)
        return
      }

      if (!res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setResult(full)
      }
    } catch {
      full = 'Ошибка генерации. Проверьте соединение.'
      setResult(full)
    } finally {
      setLoading(false)
      if (full && !full.startsWith('Ошибка')) {
        const doc: SavedDoc = {
          id: Date.now().toString(),
          type: docType,
          title: DOC_TYPES.find((d) => d.id === docType)!.title,
          clientName: form.clientName,
          amount: form.amount,
          date: form.date,
          content: full,
          createdAt: new Date().toISOString(),
        }
        const next = [doc, ...savedDocs].slice(0, 20)
        setSavedDocs(next)
        saveToStorage(STORAGE_KEYS.DOCUMENTS, next)
      }
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docType}_${form.docNumber}_${form.date}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPDF() {
    const title = selectedType.title
    const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;margin:2cm;color:#111}pre{white-space:pre-wrap;font-family:inherit;font-size:12pt}h1{font-size:14pt;text-align:center;margin-bottom:1em}@media print{@page{size:A4;margin:2cm}}</style>
</head><body><h1>${title}</h1><pre>${result.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<script>window.onload=()=>{window.print()}<\/script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  function deleteDoc(id: string) {
    const next = savedDocs.filter((d) => d.id !== id)
    setSavedDocs(next)
    saveToStorage(STORAGE_KEYS.DOCUMENTS, next)
  }

  function openDoc(doc: SavedDoc) {
    setDocType(doc.type)
    setResult(doc.content)
    setStep('result')
    setShowHistory(false)
  }

  async function sendEmail() {
    if (!emailAddress || emailSending) return
    setEmailSending(true)
    setEmailResult(null)
    const res = await fetch('/api/documents/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAddress, content: result, title: selectedType.title }),
    })
    setEmailSending(false)
    setEmailResult(res.ok ? 'ok' : 'error')
    if (res.ok) setTimeout(() => { setShowEmailModal(false); setEmailResult(null) }, 2000)
  }

  function togglePaid(id: string) {
    const next = savedDocs.map((d) =>
      d.id === id
        ? { ...d, paid: !d.paid, paidAt: !d.paid ? new Date().toISOString().split('T')[0] : undefined }
        : d
    )
    setSavedDocs(next)
    saveToStorage(STORAGE_KEYS.DOCUMENTS, next)
  }

  const selectedType = DOC_TYPES.find((d) => d.id === docType)!

  // History view
  if (showHistory) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <h2 className="font-bold text-gray-900">История документов</h2>
        </div>
        {savedDocs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Нет сохранённых документов</p>
            <p className="text-xs text-gray-400 mt-1">Созданные документы появятся здесь</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {savedDocs.map((doc) => {
              const dt = DOC_TYPES.find((d) => d.id === doc.type)!
              return (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', dt.gradient)}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400">{doc.clientName} · {doc.date} · ₽{doc.amount}</p>
                    {doc.paid && doc.paidAt && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">Оплачено {doc.paidAt}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePaid(doc.id)}
                      title={doc.paid ? 'Отметить как неоплаченный' : 'Отметить как оплаченный'}
                      className={cn(
                        'px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                        doc.paid
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      {doc.paid ? '✓ Оплачен' : 'Не оплачен'}
                    </button>
                    <button
                      onClick={() => openDoc(doc)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Step 1: select */}
      {step === 'select' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DOC_TYPES.map(({ id, icon: Icon, title, desc, gradient }) => (
              <button
                key={id}
                onClick={() => { setDocType(id); setStep('form') }}
                className="group bg-white border border-gray-100 hover:border-transparent hover:shadow-lg rounded-3xl p-6 text-left transition-all"
              >
                <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-sm', gradient)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 mt-4 text-indigo-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Создать <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          {savedDocs.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">История документов</p>
                  <p className="text-xs text-gray-400">{savedDocs.length} сохранённых</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </>
      )}

      {/* Step 2: form */}
      {step === 'form' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={cn('px-6 pt-6 pb-5 bg-gradient-to-r', selectedType.gradient)}>
            <button
              onClick={() => setStep('select')}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Сменить тип
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">{selectedType.title}</p>
                <p className="text-white/60 text-xs">Заполните данные и нажмите «Сгенерировать»</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Executor section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ваши данные (исполнитель)</p>
                <a href="/profile" className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                  <UserCircle className="w-3.5 h-3.5" /> Изменить в профиле
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Имя / название" value={form.executorName} onChange={(v) => set('executorName', v)} placeholder="Иванов Иван Иванович" />
                <Field label="ИНН" value={form.executorInn} onChange={(v) => set('executorInn', v)} placeholder="123456789012" />
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Статус</label>
                <select
                  value={form.executorStatus}
                  onChange={(e) => set('executorStatus', e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Client section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Заказчик</p>
                {clients.length > 0 && (
                  <button
                    onClick={() => setShowClientPicker(!showClientPicker)}
                    className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Выбрать из базы
                  </button>
                )}
              </div>

              {showClientPicker && (
                <div className="mb-3 bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600">Выберите клиента</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-indigo-100">
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => pickClient(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-100/60 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-200 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.type}{c.phone ? ` · ${c.phone}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Имя / название организации" value={form.clientName} onChange={(v) => set('clientName', v)} placeholder='ООО "Рога и копыта"' />
                <Field label="ИНН заказчика" value={form.clientInn} onChange={(v) => set('clientInn', v)} placeholder="Необязательно" />
              </div>
            </div>

            {/* Details */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Детали</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Описание работ / услуг</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={2}
                    placeholder="Разработка и вёрстка лендинга..."
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Сумма (₽)" value={form.amount} onChange={(v) => set('amount', v)} placeholder="50000" />
                  <Field label="Дата" value={form.date} onChange={(v) => set('date', v)} type="date" />
                  <Field label="№ документа" value={form.docNumber} onChange={(v) => set('docNumber', v)} placeholder="1" />
                  {docType === 'contract' && (
                    <Field label="Срок выполнения" value={form.deadline} onChange={(v) => set('deadline', v)} placeholder="30 дней" />
                  )}
                  {docType === 'invoice' && (
                    <Field label="Кол-во" value={form.quantity} onChange={(v) => set('quantity', v)} placeholder="1" />
                  )}
                </div>
                {docType === 'invoice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Банк" value={form.bankName} onChange={(v) => set('bankName', v)} placeholder="Тинькофф" />
                    <Field label="БИК" value={form.bik} onChange={(v) => set('bik', v)} placeholder="044525974" />
                    <Field label="Расчётный счёт" value={form.account} onChange={(v) => set('account', v)} placeholder="40802810..." />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!form.executorName || !form.clientName || !form.description || !form.amount}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Сгенерировать документ
            </button>
          </div>
        </div>
      )}

      {/* Step 3: result */}
      {step === 'result' && limitError && (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Лимит исчерпан</p>
              <p className="text-sm text-gray-500 mt-0.5">{limitError}</p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
              Тарифы →
            </Link>
          </div>
          <div className="px-6 pb-5">
            <button
              onClick={() => { setLimitError(null); setStep('form') }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к форме
            </button>
          </div>
        </div>
      )}

      {step === 'result' && !limitError && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/80">
            <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center', selectedType.gradient)}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-gray-900 text-sm flex-1">{selectedType.title}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
              <button
                onClick={download}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" /> TXT
              </button>
              <button
                onClick={downloadPDF}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 shadow-sm shadow-indigo-200"
              >
                <Printer className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => { setShowEmailModal(true); setEmailResult(null) }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
            </div>
          </div>

          {showEmailModal && (
            <div className="mx-6 mt-0 mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Отправить документ на email</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendEmail()}
                    placeholder="your@email.com"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={sendEmail}
                  disabled={!emailAddress || emailSending}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  {emailSending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Отправить
                </button>
                <button onClick={() => setShowEmailModal(false)} className="px-3 py-2.5 text-gray-400 hover:text-gray-600 rounded-xl text-sm transition-colors">✕</button>
              </div>
              {emailResult === 'ok' && (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" /> Документ отправлен на {emailAddress}
                </p>
              )}
              {emailResult === 'error' && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">Ошибка отправки. Проверьте RESEND_API_KEY.</p>
              )}
            </div>
          )}

          <div className="p-6">
            {loading && !result && (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-medium">Генерирую документ...</span>
              </div>
            )}
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {result}
              {loading && <span className="animate-pulse text-indigo-500">▌</span>}
            </pre>
          </div>

          <div className="px-6 pb-6 flex gap-2">
            <button
              onClick={() => { setResult(''); setStep('form') }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Изменить данные
            </button>
            <button
              onClick={() => { setResult(''); setForm((f) => ({ ...f, clientName: '', clientInn: '', description: '', amount: '' })); setStep('select') }}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Новый документ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder = '', type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
      />
    </div>
  )
}
