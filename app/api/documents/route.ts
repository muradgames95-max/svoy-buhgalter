import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan, PLAN_LIMITS } from '@/lib/subscription'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM = `Ты — генератор юридических документов для российских самозанятых и ИП.
Создавай документы строго по шаблону, профессионально, без лишних слов.
Используй корректные российские юридические формулировки 2026 года.
Возвращай ТОЛЬКО текст документа — без пояснений, без markdown-заголовков, без комментариев.`

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]

  if (limits.documents !== Infinity) {
    const monthKey = currentMonthKey()
    const userData = await prisma.userData.findUnique({ where: { userId } })
    const sameMonth = userData?.docMonthKey === monthKey
    const count = sameMonth ? (userData?.docMonthCount ?? 0) : 0

    if (count >= limits.documents) {
      return new Response(
        JSON.stringify({ error: 'limit', message: `Лимит документов на бесплатном тарифе исчерпан. Оформите подписку для продолжения.` }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.userData.upsert({
      where: { userId },
      update: { docMonthKey: monthKey, docMonthCount: sameMonth ? count + 1 : 1 },
      create: { userId, docMonthKey: monthKey, docMonthCount: 1 },
    })
  }

  const { type, data } = await req.json()

  const prompts: Record<string, string> = {
    act: `Создай Акт выполненных работ (оказанных услуг) на основе данных:
Исполнитель: ${data.executorName}, ИНН: ${data.executorInn}, статус: ${data.executorStatus}
Заказчик: ${data.clientName}${data.clientInn ? ', ИНН: ' + data.clientInn : ''}
Описание работ/услуг: ${data.description}
Сумма: ${data.amount} рублей
Дата: ${data.date}
Номер акта: ${data.docNumber || '1'}

Включи: номер и дату документа, полное описание выполненных работ/услуг, сумму прописью, подписи сторон. Для самозанятого добавь пометку об НПД.`,

    contract: `Создай Договор оказания услуг (подряда) на основе данных:
Исполнитель: ${data.executorName}, ИНН: ${data.executorInn}, статус: ${data.executorStatus}
Заказчик: ${data.clientName}${data.clientInn ? ', ИНН: ' + data.clientInn : ''}
Предмет договора: ${data.description}
Стоимость: ${data.amount} рублей
Срок выполнения: ${data.deadline || 'по соглашению сторон'}
Дата договора: ${data.date}
Номер договора: ${data.docNumber || '1'}

Включи: предмет, права и обязанности сторон, порядок оплаты, сроки, порядок сдачи-приёмки, ответственность сторон, реквизиты. Добавь важные пункты для защиты самозанятого от переквалификации в трудовые отношения.`,

    invoice: `Создай Счёт на оплату на основе данных:
Поставщик/Исполнитель: ${data.executorName}, ИНН: ${data.executorInn}, статус: ${data.executorStatus}
Банк: ${data.bankName || 'Тинькофф Банк'}, БИК: ${data.bik || '____'}, Р/с: ${data.account || '____'}
Покупатель/Заказчик: ${data.clientName}${data.clientInn ? ', ИНН: ' + data.clientInn : ''}
Услуга/товар: ${data.description}
Количество: ${data.quantity || 1}
Цена за единицу: ${data.amount} руб.
Дата счёта: ${data.date}
Номер счёта: ${data.docNumber || '1'}

Создай табличный счёт с: наименованием, количеством, ценой, суммой. Укажи итоговую сумму. Для самозанятого добавь: "НДС не облагается в связи с применением НПД".`,
  }

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompts[type] }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
