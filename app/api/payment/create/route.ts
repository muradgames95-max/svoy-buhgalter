import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { randomUUID } from 'crypto'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

const PRICES: Record<string, { monthly: number; yearly: number; description: string }> = {
  self: { monthly: 299, yearly: 2872, description: 'Тариф «Самозанятый»' },
  ip: { monthly: 799, yearly: 7670, description: 'Тариф «ИП / ООО»' },
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { planId: string; period: 'monthly' | 'yearly' }
  const { planId, period } = body

  if (!PRICES[planId]) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })

  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY ||
      YOOKASSA_SHOP_ID === 'your_shop_id' || YOOKASSA_SECRET_KEY === 'your_secret_key') {
    return NextResponse.json({ error: 'yookassa_not_configured' }, { status: 503 })
  }

  const plan = PRICES[planId]
  const amount = period === 'yearly' ? plan.yearly : plan.monthly

  const idempotenceKey = randomUUID()

  const ykRes = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${NEXT_PUBLIC_URL}/pricing?success=1`,
      },
      description: `${plan.description} (${period === 'yearly' ? 'ежегодно' : 'ежемесячно'})`,
      metadata: { userId: session.user.id, planId, period },
    }),
  })

  if (!ykRes.ok) {
    const err = await ykRes.text()
    return NextResponse.json({ error: 'yookassa_error', detail: err }, { status: 502 })
  }

  const payment = await ykRes.json() as { confirmation: { confirmation_url: string } }
  return NextResponse.json({ url: payment.confirmation.confirmation_url })
}
