import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserPlan, getUserMonthlyUsage, PLAN_LIMITS } from '@/lib/subscription'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({
      plan: 'free',
      expiresAt: null,
      period: null,
      usage: { chatCount: 0, docCount: 0 },
      limits: PLAN_LIMITS.free,
    })
  }

  try {
    const [plan, usage, user] = await Promise.all([
      getUserPlan(session.user.id),
      getUserMonthlyUsage(session.user.id),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { planExpiresAt: true, planPeriod: true },
      }),
    ])

    const limits = PLAN_LIMITS[plan]

    return NextResponse.json({
      plan,
      expiresAt: user?.planExpiresAt ?? null,
      period: user?.planPeriod ?? null,
      usage,
      limits: {
        aiQuestions: limits.aiQuestions === Infinity ? null : limits.aiQuestions,
        documents: limits.documents === Infinity ? null : limits.documents,
      },
    })
  } catch (e) {
    console.error('[subscription] GET failed', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
