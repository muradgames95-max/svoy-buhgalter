import { auth } from '@/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, content, title } = await req.json() as { email: string; content: string; title: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Неверный email' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY

    const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Свой Бухгалтер</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:14px">${safeTitle}</p>
    </div>
    <div style="padding:28px 32px">
      <pre style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;margin:0">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#aaa">Свой Бухгалтер — AI-бухгалтер для самозанятых и ИП</p>
    </div>
  </div>
</body>
</html>`

    if (!apiKey) {
      return Response.json({
        ok: true,
        note: 'Настройте RESEND_API_KEY в .env.local для реальной отправки',
      })
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@svoy-buhgalter.ru',
        to: email,
        subject: title,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('[documents/email] Resend error:', err)
      return Response.json({ error: 'Ошибка отправки' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[documents/email]', e)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
