import Anthropic from '@anthropic-ai/sdk'
import { TAX_SYSTEM_PROMPT } from '@/lib/prompts'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan, PLAN_LIMITS } from '@/lib/subscription'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

  if (limits.aiQuestions !== Infinity) {
    const monthKey = currentMonthKey()
    const userData = await prisma.userData.findUnique({ where: { userId } })
    const sameMonth = userData?.chatMonthKey === monthKey
    const count = sameMonth ? (userData?.chatMonthCount ?? 0) : 0

    if (count >= limits.aiQuestions) {
      return new Response(
        JSON.stringify({ error: 'limit', message: `Лимит ${limits.aiQuestions} вопросов в месяц исчерпан. Оформите подписку для продолжения.` }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.userData.upsert({
      where: { userId },
      update: { chatMonthKey: monthKey, chatMonthCount: sameMonth ? count + 1 : 1 },
      create: { userId, chatMonthKey: monthKey, chatMonthCount: 1 },
    })
  }

  const { messages, userContext } = await req.json()
  const systemPrompt = userContext ? TAX_SYSTEM_PROMPT + userContext : TAX_SYSTEM_PROMPT

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
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
