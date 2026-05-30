import { auth } from '@/auth'

interface DeadlineItem {
  title: string
  date: string
  description: string
  type: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildEmailHtml(deadlines: DeadlineItem[]): string {
  const rows = deadlines.map((d) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#111">${esc(d.title)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#666;white-space:nowrap">${esc(d.date)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px">${esc(d.description)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Свой Бухгалтер</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:14px">Ближайшие налоговые дедлайны</p>
    </div>
    <div style="padding:28px 32px">
      ${deadlines.length === 0
        ? '<p style="color:#666;font-size:15px">Нет ближайших дедлайнов на 30 дней вперёд. Отличная новость!</p>'
        : `<p style="color:#444;font-size:14px;margin:0 0 20px">Дедлайны на ближайшие <strong>30 дней</strong>:</p>
           <table style="width:100%;border-collapse:collapse">
             <thead><tr>
               <th style="text-align:left;padding:8px 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em">Событие</th>
               <th style="text-align:left;padding:8px 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em">Дата</th>
               <th style="text-align:left;padding:8px 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em">Описание</th>
             </tr></thead>
             <tbody>${rows}</tbody>
           </table>`
      }
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#aaa">Свой Бухгалтер — AI-бухгалтер для самозанятых и ИП</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { email, deadlines } = await req.json() as { email: string; deadlines: DeadlineItem[] }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Неверный email' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.log('[notify-email] RESEND_API_KEY not set. Would send to:', email)
      return Response.json({
        ok: true,
        note: 'Настройте RESEND_API_KEY в .env.local для реальной отправки писем',
      })
    }

    const html = buildEmailHtml(deadlines)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@svoy-buhgalter.ru',
        to: email,
        subject: `Налоговые дедлайны — ${deadlines.length} ближайших`,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('[notify-email] Resend error:', err)
      return Response.json({ error: 'Ошибка отправки' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[notify-email]', e)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
