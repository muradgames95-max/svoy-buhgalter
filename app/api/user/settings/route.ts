import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userData = await prisma.userData.findUnique({ where: { userId: session.user.id } })
    const settings = JSON.parse(userData?.settings || '{}') as Record<string, unknown>
    return NextResponse.json({
      notifyEnabled: settings.notifyEnabled ?? false,
      notifyTax: settings.notifyTax ?? false,
      notifyDays: settings.notifyDays ?? [3, 7],
    })
  } catch (e) {
    console.error('[user/settings] GET failed', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as Record<string, unknown>
    const allowed = ['notifyEnabled', 'notifyTax', 'notifyDays']
    const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const userData = await prisma.userData.findUnique({ where: { userId: session.user.id } })
    const current = JSON.parse(userData?.settings || '{}') as Record<string, unknown>
    const updated = { ...current, ...patch }

    await prisma.userData.upsert({
      where: { userId: session.user.id },
      update: { settings: JSON.stringify(updated) },
      create: { userId: session.user.id, settings: JSON.stringify(updated) },
    })

    return NextResponse.json({ ok: true, ...patch })
  } catch (e) {
    console.error('[user/settings] PATCH failed', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
