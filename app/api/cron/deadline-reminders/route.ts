import { prisma } from '@/lib/prisma'
import { DEADLINES_2026, getDaysUntil, type TaxRegime } from '@/lib/deadlines'

const NOTIFY_DAYS = [3, 7]

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildEmailHtml(deadlines: { title: string; date: string; description: string; daysLeft: number }[], daysLeft: number): string {
  const urgencyColor = daysLeft <= 3 ? '#dc2626' : '#d97706'
  const urgencyBg = daysLeft <= 3 ? '#fef2f2' : '#fffbeb'
  const label = daysLeft <= 3 ? `⚠️ Осталось ${daysLeft} дня!` : `📅 Через ${daysLeft} дней`

  const rows = deadlines.map((d) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0">
        <div style="font-weight:600;color:#111;font-size:14px">${esc(d.title)}</div>
        <div style="color:#888;font-size:12px;margin-top:2px">${esc(d.description)}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;white-space:nowrap;color:#666;font-size:13px;vertical-align:top">
        ${esc(d.date)}
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Свой Бухгалтер</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">Напоминание о налоговых дедлайнах</p>
    </div>
    <div style="background:${urgencyBg};border-left:4px solid ${urgencyColor};padding:14px 20px;margin:0">
      <p style="margin:0;color:${urgencyColor};font-weight:700;font-size:15px">${label}</p>
    </div>
    <div style="padding:24px 32px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 16px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.06em">Дедлайн</th>
            <th style="text-align:left;padding:8px 16px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap">Дата</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center">
      <a href="https://svoy-buhgalter.ru/deadlines" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:600">
        Открыть дедлайны →
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#bbb">
        Отключить уведомления можно в <a href="https://svoy-buhgalter.ru/deadlines" style="color:#999">настройках дедлайнов</a>.
      </p>
    </div>
  </div>
</body>
</html>`
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  return `${day} ${months[month - 1]} ${year}`
}

export async function GET(req: Request) {
  // Vercel cron sends Authorization header with CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find deadlines that are exactly 3 or 7 days away
  const triggerDeadlines = DEADLINES_2026.flatMap((d) => {
    const days = getDaysUntil(d.date)
    if (NOTIFY_DAYS.includes(days)) return [{ ...d, daysLeft: days }]
    return []
  })

  if (triggerDeadlines.length === 0) {
    return Response.json({ ok: true, sent: 0, reason: 'No deadlines today' })
  }

  // Load all users with their data
  const allUserData = await prisma.userData.findMany({
    include: { user: { select: { email: true } } },
  })

  let sent = 0
  const errors: string[] = []

  for (const userData of allUserData) {
    try {
      const settings = JSON.parse(userData.settings || '{}') as {
        notifyEnabled?: boolean
        notifyDays?: number[]
        sentNotifications?: Record<string, string>
        taxRegime?: string
      }

      if (!settings.notifyEnabled) continue

      const userEmail = userData.user.email
      if (!userEmail) continue

      const profile = JSON.parse(userData.profile || '{}') as { taxRegime?: string }
      const regime = (profile.taxRegime || settings.taxRegime || '').toUpperCase()

      const regimeMap: Record<string, TaxRegime[]> = {
        'НПД': ['НПД'],
        'NPD': ['НПД'],
        'УСН': ['УСН', 'ИП'],
        'USN': ['УСН', 'ИП'],
        'ОСНО': ['ОСНО', 'ИП'],
        'OSNO': ['ОСНО', 'ИП'],
      }
      const userRegimes = regimeMap[regime] ?? []

      const notifyDays = settings.notifyDays ?? [3, 7]
      const sentNotifications = settings.sentNotifications ?? {}
      const todayStr = today.toISOString().slice(0, 10)

      // Group deadlines by daysLeft
      const toSendByDays = new Map<number, typeof triggerDeadlines>()

      for (const d of triggerDeadlines) {
        if (!notifyDays.includes(d.daysLeft)) continue
        if (userRegimes.length > 0 && !d.regime.some((r) => userRegimes.includes(r))) continue

        const key = `${d.id}_${d.daysLeft}d`
        if (sentNotifications[key] === todayStr) continue // already sent today

        if (!toSendByDays.has(d.daysLeft)) toSendByDays.set(d.daysLeft, [])
        toSendByDays.get(d.daysLeft)!.push(d)
      }

      if (toSendByDays.size === 0) continue

      // Send one email per daysLeft group
      for (const [daysLeft, deadlines] of toSendByDays) {
        const html = buildEmailHtml(
          deadlines.map((d) => ({ title: d.title, date: formatDate(d.date), description: d.description, daysLeft })),
          daysLeft
        )

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? 'noreply@svoy-buhgalter.ru',
            to: userEmail,
            subject: `Свой Бухгалтер: дедлайн через ${daysLeft} ${daysLeft === 3 ? 'дня' : 'дней'} — ${deadlines[0].title}${deadlines.length > 1 ? ` и ещё ${deadlines.length - 1}` : ''}`,
            html,
          }),
        })

        if (resendRes.ok) {
          // Mark as sent
          for (const d of deadlines) {
            sentNotifications[`${d.id}_${daysLeft}d`] = todayStr
          }
          sent++
        } else {
          const err = await resendRes.text()
          errors.push(`${userEmail}: ${err}`)
        }
      }

      // Persist updated sentNotifications
      await prisma.userData.update({
        where: { userId: userData.userId },
        data: { settings: JSON.stringify({ ...settings, sentNotifications }) },
      })
    } catch (e) {
      errors.push(String(e))
    }
  }

  console.log(`[cron/deadline-reminders] sent=${sent}, errors=${errors.length}`)
  return Response.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined })
}
