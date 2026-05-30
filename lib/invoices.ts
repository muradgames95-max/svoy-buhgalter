export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  price: number
}

export interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  clientName: string
  clientInn: string
  clientAddress: string
  items: InvoiceItem[]
  notes: string
  status: 'draft' | 'sent' | 'paid'
  createdAt: string
}

export function calcInvoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((s, i) => s + i.quantity * i.price, 0)
}

export function nextInvoiceNumber(invoices: Invoice[]): string {
  if (invoices.length === 0) return 'СЧ-001'
  const nums = invoices
    .map((inv) => parseInt(inv.number.replace(/\D/g, '')) || 0)
    .filter((n) => !isNaN(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `СЧ-${String(max + 1).padStart(3, '0')}`
}

export function formatInvoiceDate(date: string): string {
  const [y, m, d] = date.split('-')
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y} г.`
}

export const STATUS_LABELS: Record<Invoice['status'], string> = {
  draft: 'Черновик',
  sent: 'Отправлен',
  paid: 'Оплачен',
}

export const STATUS_COLORS: Record<Invoice['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
}

export const UNIT_OPTIONS = ['услуга', 'час', 'шт.', 'день', 'мес.', 'работа', 'проект']

export function emptyItem(): InvoiceItem {
  return { id: Date.now().toString(), description: '', quantity: 1, unit: 'услуга', price: 0 }
}
