import { DEADLINES_2026, getDaysUntil } from './deadlines'

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
