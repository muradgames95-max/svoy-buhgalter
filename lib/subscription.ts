import { prisma } from './prisma'

export type Plan = 'free' | 'self' | 'ip'

export const PLAN_NAMES: Record<Plan, string> = {
  free: 'Бесплатно',
  self: 'Самозанятый',
  ip: 'ИП / ООО',
}

export const PLAN_LIMITS: Record<Plan, { aiQuestions: number; documents: number }> = {
  free: { aiQuestions: 3, documents: 1 },
  self: { aiQuestions: Infinity, documents: Infinity },
  ip: { aiQuestions: Infinity, documents: Infinity },
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  })

  if (!user) return 'free'

  const plan = user.plan as Plan
  if (plan === 'free') return 'free'

  if (user.planExpiresAt && user.planExpiresAt < new Date()) {
    await prisma.user.update({ where: { id: userId }, data: { plan: 'free', planExpiresAt: null, planPeriod: null } })
    return 'free'
  }

  return plan
}

export async function getUserMonthlyUsage(userId: string): Promise<{ chatCount: number; docCount: number }> {
  const userData = await prisma.userData.findUnique({ where: { userId } })
  if (!userData) return { chatCount: 0, docCount: 0 }

  const monthKey = currentMonthKey()
  const chatCount = userData.chatMonthKey === monthKey ? (userData.chatMonthCount ?? 0) : 0
  const docCount = userData.docMonthKey === monthKey ? (userData.docMonthCount ?? 0) : 0

  return { chatCount, docCount }
}
