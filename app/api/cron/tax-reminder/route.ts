import { prisma } from '@/lib/prisma'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildEmailHtml(taxAmount: number, dueDate: string, month: string): string {
  const formatted = taxAmount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Свой Бухгалтер</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">Напоминание об уплате налога НПД</p>
    </div>
    <div style="background:#fffbeb;border-left:4px solid #d97706;padding:14px 20px">
      <p style="margin:0;color:#d97706;font-weight:700;font-size:15px">💰 До 28 ${esc(month)} нужно оплатить налог</p>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6">
        Налоговая сформировала начисление по итогам прошлого месяца.
        Оплатите через приложение «Мой налог» или банк.
      </p>
      <div style="background:#f5f3ff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
        <p style="margin:0 0 6px;color:#7c3aed;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Расчётная сумма налога</p>
        <p style="margin:0;color:#4f46e5;font-size:32px;font-weight:900">${esc(formatted)}</p>
        <p style="margin:6px 0 0;color:#999;font-size:12px">на основе ваших доходов в приложении</p>
      </div>
      <p style="margin:0 0 8px;color:#555;font-size:13px;line-height:1.6">
        <strong>Как оплатить:</strong><br>
        1. Откройте приложение «Мой налог» (или ЛК на сайте ФНС)<br>
        2. Нажмите «Оплатить» — налог уже сформирован<br>
        3. Оплатите удобным способом
      </p>
      <p style="margin:16px 0 0;color:#888;font-size:12px">
        Срок уплаты: <strong>28 ${esc(dueDate)}</strong>. При просрочке начисляется пеня.
      </p>
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center">
      <a href="https://svoy-buhgalter.ru/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:600">
        Открыть финансы →
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#bbb">
        Отключить напоминания можно в <a href="https://svoy-buhgalter.ru/profile" style="color:#999">настройках профиля</a>.
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(req: Request) {
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
  const day = today.getDate()
  // Only send on days 23–28 of the month
  if (day < 23 || day > 28) {
    return Response.json({ ok: true, sent: 0, reason: `Day ${day} — not in reminder window` })
  }

  const monthNames = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре']
  const month = monthNames[today.getMonth()]

  const allUserData = await prisma.userData.findMany({
    include: { user: { select: { email: true } } },
  })

  let sent = 0
  const errors: string[] = []

  for (const userData of allUserData) {
    try {
      const settings = JSON.parse(userData.settings || '{}') as {
        notifyTax?: boolean
        sentTaxNotifications?: Record<string, string>
      }

      if (!settings.notifyTax) continue

      const userEmail = userData.user.email
      if (!userEmail) continue

      // Avoid duplicate sends on the same day
      const todayStr = today.toISOString().slice(0, 10)
      const sentKey = `tax_${todayStr.slice(0, 7)}` // e.g. "tax_2026-05"
      if (settings.sentTaxNotifications?.[sentKey] === todayStr) continue

      // Calculate NPD tax from stored income data
      const incomes = JSON.parse(userData.incomes || '[]') as { amount: number; date: string; isLegal?: boolean }[]
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthStr = lastMonth.toISOString().slice(0, 7) // "2026-04"

      const monthIncomes = incomes.filter((i) => i.date?.startsWith(lastMonthStr))
      const physicalIncome = monthIncomes.filter((i) => !i.isLegal).reduce((s, i) => s + i.amount, 0)
      const legalIncome = monthIncomes.filter((i) => i.isLegal).reduce((s, i) => s + i.amount, 0)
      const taxAmount = Math.round(physicalIncome * 0.04 + legalIncome * 0.06)

      if (taxAmount <= 0) {
        // No income last month — skip
        continue
      }

      const html = buildEmailHtml(taxAmount, month, month)

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@svoy-buhgalter.ru',
          to: userEmail,
          subject: `Свой Бухгалтер: уплатите налог НПД до 28 ${month}`,
          html,
        }),
      })

      if (resendRes.ok) {
        const sentNotifications = { ...settings.sentTaxNotifications, [sentKey]: todayStr }
        await prisma.userData.update({
          where: { userId: userData.userId },
          data: { settings: JSON.stringify({ ...settings, sentTaxNotifications: sentNotifications }) },
        })
        sent++
      } else {
        const err = await resendRes.text()
        errors.push(`${userEmail}: ${err}`)
      }
    } catch (e) {
      errors.push(String(e))
    }
  }

  console.log(`[cron/tax-reminder] sent=${sent}, errors=${errors.length}`)
  return Response.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined })
}
