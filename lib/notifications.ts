import { DEADLINES_2026, getDaysUntil } from './deadlines'
import { loadFromStorage, STORAGE_KEYS } from './storage'

interface Income { id: string; amount: number; isLegal: boolean; date: string }

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function checkDeadlineNotifications() {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const seenKey = 'sb_notified_deadlines'
  let seen: string[] = []
  try { seen = JSON.parse(localStorage.getItem(seenKey) ?? '[]') } catch { seen = [] }

  const today = new Date().toISOString().split('T')[0]
  const newSeen = [...seen]

  for (const d of DEADLINES_2026) {
    const days = getDaysUntil(d.date)
    if (days < 0 || days > 7) continue
    const notifId = `${d.date}-${today}`
    if (seen.includes(notifId)) continue

    const label = days === 0 ? 'сегодня!' : days === 1 ? 'завтра' : `через ${days} дн.`
    new Notification(`Дедлайн ${label}`, {
      body: d.title,
      icon: '/icon-192.png',
    })
    newSeen.push(notifId)
  }

  localStorage.setItem(seenKey, JSON.stringify(newSeen))
}

export function checkTaxReminderNotification() {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const today = new Date()
  const day = today.getDate()
  if (day < 23 || day > 28) return

  const seenKey = `sb_tax_notif_${today.toISOString().slice(0, 7)}`
  if (localStorage.getItem(seenKey) === '1') return

  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthStr = lastMonth.toISOString().slice(0, 7)
  const incomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
  const monthIncomes = incomes.filter((i) => i.date?.startsWith(lastMonthStr))
  const physical = monthIncomes.filter((i) => !i.isLegal).reduce((s, i) => s + i.amount, 0)
  const legal = monthIncomes.filter((i) => i.isLegal).reduce((s, i) => s + i.amount, 0)
  const tax = Math.round(physical * 0.04 + legal * 0.06)
  if (tax <= 0) return

  const daysLeft = 28 - day
  const body = daysLeft === 0
    ? `Сегодня последний день! Сумма: ${tax.toLocaleString('ru-RU')} ₽`
    : `До 28-го осталось ${daysLeft} дн. Сумма: ${tax.toLocaleString('ru-RU')} ₽`

  new Notification('Уплата налога НПД', { body, icon: '/icon-192.png' })
  localStorage.setItem(seenKey, '1')
}
