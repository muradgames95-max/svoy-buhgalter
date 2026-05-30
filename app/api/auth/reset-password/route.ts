import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  let body: { email?: string; token?: string; password?: string }
  try {
    body = await req.json() as { email?: string; token?: string; password?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const token = (body.token ?? '').trim()
  const password = body.password ?? ''

  if (!email || !token || !password) {
    return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов' }, { status: 400 })
  }

  try {
    const record = await prisma.verificationToken.findFirst({ where: { identifier: email, token } })

    if (!record) {
      return NextResponse.json({ error: 'Недействительная ссылка для сброса пароля' }, { status: 400 })
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      return NextResponse.json({ error: 'Ссылка для сброса пароля истекла. Запросите новую.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { email }, data: { password: hashed } })
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[reset-password] error', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
