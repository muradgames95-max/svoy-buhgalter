import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.userData.findUnique({ where: { userId: session.user.id } })
  if (!row) return NextResponse.json({ data: null })

  return NextResponse.json({
    data: {
      sb_incomes: row.incomes,
      sb_expenses: row.expenses,
      sb_clients: row.clients,
      sb_documents: row.documents,
      sb_profile: row.profile,
      sb_settings: row.settings,
      sb_chat_history: row.chatHistory,
    },
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, string>

  await prisma.userData.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      incomes: body.sb_incomes ?? '[]',
      expenses: body.sb_expenses ?? '[]',
      clients: body.sb_clients ?? '[]',
      documents: body.sb_documents ?? '[]',
      profile: body.sb_profile ?? '{}',
      settings: body.sb_settings ?? '{}',
      chatHistory: body.sb_chat_history ?? '[]',
    },
    update: {
      incomes: body.sb_incomes ?? '[]',
      expenses: body.sb_expenses ?? '[]',
      clients: body.sb_clients ?? '[]',
      documents: body.sb_documents ?? '[]',
      profile: body.sb_profile ?? '{}',
      settings: body.sb_settings ?? '{}',
      chatHistory: body.sb_chat_history ?? '[]',
    },
  })

  return NextResponse.json({ ok: true })
}
