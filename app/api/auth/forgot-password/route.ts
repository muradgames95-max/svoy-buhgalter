import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  let body: { email?: string }
  try {
    body = await req.json() as { email?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      await prisma.verificationToken.create({ data: { identifier: email, token, expires } })

      const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

      const resendKey = process.env.RESEND_API_KEY
      if (resendKey && resendKey !== 'your_resend_key') {
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: 'Сброс пароля — Свой Бухгалтер',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
                <h2 style="margin:0 0 16px">Сброс пароля</h2>
                <p style="color:#555;margin:0 0 24px">Нажмите на кнопку ниже, чтобы установить новый пароль. Ссылка действует 1 час.</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
                  Сбросить пароль
                </a>
                <p style="color:#999;font-size:12px;margin:24px 0 0">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
              </div>
            `,
          }),
          signal: AbortSignal.timeout(10000),
        }).catch((e) => console.error('[forgot-password] email send failed', e))
      } else {
        console.log('[forgot-password] Reset URL (dev):', resetUrl)
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[forgot-password] error', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
