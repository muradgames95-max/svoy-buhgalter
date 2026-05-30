'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Copy, Check, FileText } from 'lucide-react'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
import {
  Invoice, calcInvoiceTotal, formatInvoiceDate, STATUS_LABELS,
} from '@/lib/invoices'

interface UserProfile {
  name?: string
  inn?: string
  executorStatus?: string
  phone?: string
  email?: string
  bankName?: string
  bik?: string
  account?: string
}

function formatRub(n: number) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
}

function rubles(n: number): string {
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
    'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
    'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']

  const int = Math.floor(n)
  const kop = Math.round((n - int) * 100)

  function say(num: number): string {
    if (num === 0) return ''
    if (num < 20) return units[num]
    if (num < 100) return [tens[Math.floor(num / 10)], units[num % 10]].filter(Boolean).join(' ')
    return [hundreds[Math.floor(num / 100)], say(num % 100)].filter(Boolean).join(' ')
  }

  function plural(n: number, one: string, two: string, five: string): string {
    const m = n % 100
    if (m >= 11 && m <= 19) return five
    const r = n % 10
    if (r === 1) return one
    if (r >= 2 && r <= 4) return two
    return five
  }

  const thousands = Math.floor(int / 1000)
  const rest = int % 1000
  const parts: string[] = []

  if (thousands > 0) {
    const thou1 = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
      'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
      'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
    const tWord = plural(thousands % 10, 'тысяча', 'тысячи', 'тысяч')
    const tStr = thousands < 20 ? thou1[thousands] : say(thousands)
    parts.push([tStr, tWord].filter(Boolean).join(' '))
  }
  if (rest > 0) parts.push(say(rest))

  const rubWord = plural(int % 10, 'рубль', 'рубля', 'рублей')
  const kopWord = plural(kop, 'копейка', 'копейки', 'копеек')
  const intStr = (parts.join(' ') || 'ноль').trim()
  const capStr = intStr.charAt(0).toUpperCase() + intStr.slice(1)

  return `${capStr} ${rubWord} ${String(kop).padStart(2, '0')} ${kopWord}`
}

export default function InvoicePrintPage({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [profile, setProfile] = useState<UserProfile>({})
  const [copied, setCopied] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const invoices = loadFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, [])
    const found = invoices.find((i) => i.id === id) ?? null
    setInvoice(found)
    setProfile(loadFromStorage<UserProfile>(STORAGE_KEYS.PROFILE, {}))
    setHydrated(true)
  }, [id])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!hydrated) return null

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700">Счёт не найден</p>
          <button onClick={() => router.push('/invoices')} className="mt-3 text-indigo-600 text-sm hover:underline">
            ← Назад к счетам
          </button>
        </div>
      </div>
    )
  }

  const total = calcInvoiceTotal(invoice.items)
  const sellerName = profile.name || 'Не указано'
  const sellerStatus = profile.executorStatus || 'Самозанятый (НПД)'
  const sellerInn = profile.inn || ''
  const sellerPhone = profile.phone || ''
  const sellerEmail = profile.email || ''
  const bankName = profile.bankName || ''
  const bik = profile.bik || ''
  const account = profile.account || ''

  return (
    <>
      {/* Top bar — скрывается при печати */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/invoices')}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-bold text-gray-900 text-sm">{invoice.number}</p>
          <p className="text-xs text-gray-400">{invoice.clientName} · {STATUS_LABELS[invoice.status]}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Скопировано!' : 'Копировать ссылку'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Сохранить PDF
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="bg-gray-100 print:bg-white min-h-screen py-8 print:py-0">
        <div
          id="invoice-doc"
          className="
            bg-white mx-auto print:mx-0
            max-w-[794px] w-full
            px-12 py-10 print:px-8 print:py-8
            shadow-xl print:shadow-none
            font-sans text-gray-900
          "
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                СЧЁТ НА ОПЛАТУ №{invoice.number}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                от {formatInvoiceDate(invoice.date)}
                {invoice.dueDate && ` · Оплатить до ${formatInvoiceDate(invoice.dueDate)}`}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-700">Свой Бухгалтер</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 mb-6" />

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Seller */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Исполнитель</p>
              <p className="font-bold text-gray-900 text-sm">{sellerName}</p>
              <p className="text-sm text-gray-600 mt-0.5">{sellerStatus}</p>
              {sellerInn && <p className="text-sm text-gray-600">ИНН: {sellerInn}</p>}
              {sellerPhone && <p className="text-sm text-gray-600">{sellerPhone}</p>}
              {sellerEmail && <p className="text-sm text-gray-600">{sellerEmail}</p>}
            </div>

            {/* Client */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Заказчик</p>
              <p className="font-bold text-gray-900 text-sm">{invoice.clientName}</p>
              {invoice.clientInn && <p className="text-sm text-gray-600">ИНН: {invoice.clientInn}</p>}
              {invoice.clientAddress && <p className="text-sm text-gray-600">{invoice.clientAddress}</p>}
            </div>
          </div>

          {/* Services table */}
          <div className="mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide border border-gray-200 w-8">#</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide border border-gray-200">Наименование</th>
                  <th className="text-center py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide border border-gray-200 w-16">Кол-во</th>
                  <th className="text-center py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide border border-gray-200 w-16">Ед.</th>
                  <th className="text-right py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide border border-gray-200 w-28">Цена</th>
                  <th className="text-right py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide border border-gray-200 w-28">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-2.5 px-3 border border-gray-200 text-gray-500 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 border border-gray-200 font-medium">{item.description}</td>
                    <td className="py-2.5 px-3 border border-gray-200 text-center text-gray-600">
                      {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 border border-gray-200 text-center text-gray-600">{item.unit}</td>
                    <td className="py-2.5 px-3 border border-gray-200 text-right text-gray-700">
                      {item.price.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="py-2.5 px-3 border border-gray-200 text-right font-bold">
                      {(item.quantity * item.price).toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="py-3 px-3 border border-gray-200" />
                  <td className="py-3 px-3 border border-gray-200 text-right text-sm font-bold text-gray-700">Итого:</td>
                  <td className="py-3 px-3 border border-gray-200 text-right text-base font-black text-gray-900">
                    {formatRub(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Total in words */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 border border-gray-200">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500 font-medium shrink-0">Итого прописью:</span>
              <span className="text-sm font-semibold text-gray-800">{rubles(total)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">НДС не облагается ({sellerStatus})</p>
          </div>

          {/* Bank details */}
          {(bankName || bik || account) && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Реквизиты для оплаты</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                {bankName && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 shrink-0">Банк:</span>
                    <span className="font-medium">{bankName}</span>
                  </div>
                )}
                {bik && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 shrink-0">БИК:</span>
                    <span className="font-medium">{bik}</span>
                  </div>
                )}
                {account && (
                  <div className="flex gap-2 col-span-2">
                    <span className="text-gray-500 shrink-0">Счёт:</span>
                    <span className="font-medium tracking-wider">{account}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Примечание</p>
              <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          {/* Signature */}
          <div className="h-px bg-gray-200 mb-6 mt-4" />
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-6">Исполнитель</p>
              <div className="flex items-end gap-6">
                <div>
                  <div className="w-40 h-px bg-gray-400 mb-1" />
                  <p className="text-xs text-gray-400">подпись</p>
                </div>
                <div>
                  <div className="w-40 h-px bg-gray-400 mb-1" />
                  <p className="text-xs text-gray-400">расшифровка ({sellerName})</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Создан в</p>
              <p className="text-xs font-bold text-indigo-500">svoy-buhgalter.ru</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
