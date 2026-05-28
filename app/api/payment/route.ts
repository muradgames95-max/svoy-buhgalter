import { randomUUID } from 'crypto'

const PLAN_PRICES: Record<string, { amount: string; description: string }> = {
  self: { amount: '299.00', description: 'Свой Бухгалтер — тариф Самозанятый (1 месяц)' },
  self_yearly: { amount: '2870.00', description: 'Свой Бухгалтер — тариф Самозанятый (1 год)' },
  ip: { amount: '799.00', description: 'Свой Бухгалтер — тариф ИП/ООО (1 месяц)' },
  ip_yearly: { amount: '7670.00', description: 'Свой Бухгалтер — тариф ИП/ООО (1 год)' },
}

export async function POST(req: Request) {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    return Response.json(
      { error: 'ЮКасса не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local' },
      { status: 503 }
    )
  }

  const { planId, returnUrl } = await req.json()
  const plan = PLAN_PRICES[planId]

  if (!plan) {
    return Response.json({ error: 'Неизвестный тариф' }, { status: 400 })
  }

  const idempotenceKey = randomUUID()

  const response = await fetch('https://api.yookassa.ru/v2/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: { value: plan.amount, currency: 'RUB' },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/pricing?success=1`,
      },
      capture: true,
      description: plan.description,
      metadata: { planId },
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    return Response.json({ error: err.description || 'Ошибка ЮКасса' }, { status: 400 })
  }

  const payment = await response.json()
  return Response.json({ confirmationUrl: payment.confirmation.confirmation_url })
}
