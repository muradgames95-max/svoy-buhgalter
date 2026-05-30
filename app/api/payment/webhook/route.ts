import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY

// Plan durations in days
const PLAN_DAYS: Record<string, Record<string, number>> = {
  self: { monthly: 31, yearly: 365 },
  ip: { monthly: 31, yearly: 365 },
}

export async function POST(req: Request) {
  let body: {
    type: string
    object: {
      status: string
      metadata: { userId?: string; planId?: string; period?: string }
      id: string
    }
  }
  try {
    body = await req.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify it's a real payment notification by fetching from YooKassa
  if (YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY &&
      YOOKASSA_SHOP_ID !== 'your_shop_id' &&
      body.type === 'notification' && body.object?.status === 'succeeded') {

    const paymentId = body.object.id
    let verifyRes: Response
    try {
      verifyRes = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        },
        signal: AbortSignal.timeout(10000),
      })
    } catch (e) {
      console.error('[webhook] YooKassa verification fetch failed', e)
      return NextResponse.json({ error: 'verification failed' }, { status: 400 })
    }

    if (!verifyRes.ok) return NextResponse.json({ error: 'verification failed' }, { status: 400 })
    const payment = await verifyRes.json() as { status: string; metadata: { userId?: string; planId?: string; period?: string } }
    if (payment.status !== 'succeeded') return NextResponse.json({ ok: true })

    const { userId, planId, period } = payment.metadata
    if (!userId || !planId || !period) return NextResponse.json({ error: 'missing metadata' }, { status: 400 })

    const days = PLAN_DAYS[planId]?.[period] ?? 31
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: planId, planExpiresAt: expiresAt, planPeriod: period },
      })
    } catch (e) {
      console.error('[webhook] DB update failed', e)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
