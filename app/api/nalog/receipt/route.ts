import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Мой налог API (ФНС LKNPD)
const NALOG_API = 'https://lknpd.nalog.ru/api/v1'

interface ReceiptRequest {
  amount: number
  description: string
  isLegal: boolean
  clientName?: string
  clientInn?: string
  nalogToken: string
  nalogInn: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as ReceiptRequest
  const { amount, description, isLegal, clientName, clientInn, nalogToken, nalogInn } = body

  if (!nalogToken || !nalogInn) {
    return NextResponse.json({ error: 'Не настроен «Мой налог»' }, { status: 400 })
  }

  const now = new Date()
  const requestTime = now.toISOString().replace('T', ' ').substring(0, 19)

  const payload = {
    paymentType: 'CASH',
    ignoreMaxTotalIncomeRestriction: false,
    client: isLegal && clientInn ? {
      contactPhone: null,
      displayName: clientName ?? '',
      incomeType: 'FROM_LEGAL_ENTITY',
      inn: clientInn,
    } : {
      contactPhone: null,
      displayName: null,
      incomeType: 'FROM_INDIVIDUAL',
      inn: null,
    },
    requestTime,
    operationTime: requestTime,
    services: [{
      name: description,
      amount,
      quantity: 1,
    }],
    totalAmount: amount,
  }

  const res = await fetch(`${NALOG_API}/income`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${nalogToken}`,
      'Content-Type': 'application/json',
      'Inn': nalogInn,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Ошибка Мой налог: ${err}` }, { status: res.status })
  }

  const result = await res.json() as { approvedReceiptUuid: string }
  return NextResponse.json({ ok: true, receiptId: result.approvedReceiptUuid })
}
