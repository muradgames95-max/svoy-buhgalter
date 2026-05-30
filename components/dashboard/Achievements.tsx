'use client'

import { useMemo } from 'react'
import { formatRubles } from '@/lib/utils'

interface AchievementsProps {
  totalIncome: number
  totalExpenses: number
  incomeCount: number
  clientCount: number
  documentCount: number
  hasGoal: boolean
  goalReached: boolean
}

interface Badge {
  id: string
  emoji: string
  title: string
  desc: string
  unlocked: boolean
  color: string
}

export default function Achievements({
  totalIncome,
  incomeCount,
  clientCount,
  documentCount,
  hasGoal,
  goalReached,
}: AchievementsProps) {
  const badges = useMemo<Badge[]>(() => [
    {
      id: 'first_income',
      emoji: '💰',
      title: 'Первый доход',
      desc: 'Добавьте первую запись',
      unlocked: incomeCount >= 1,
      color: 'from-amber-400 to-orange-400',
    },
    {
      id: 'income_10',
      emoji: '📈',
      title: '10 записей',
      desc: 'Ведёте учёт регулярно',
      unlocked: incomeCount >= 10,
      color: 'from-indigo-400 to-violet-400',
    },
    {
      id: 'income_100k',
      emoji: '🏆',
      title: '100 000 ₽',
      desc: formatRubles(100_000) + ' дохода',
      unlocked: totalIncome >= 100_000,
      color: 'from-yellow-400 to-amber-500',
    },
    {
      id: 'income_1m',
      emoji: '🚀',
      title: '1 000 000 ₽',
      desc: 'Миллионер!',
      unlocked: totalIncome >= 1_000_000,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'first_client',
      emoji: '🤝',
      title: 'Первый клиент',
      desc: 'База клиентов запущена',
      unlocked: clientCount >= 1,
      color: 'from-sky-400 to-cyan-400',
    },
    {
      id: 'clients_5',
      emoji: '👥',
      title: '5 клиентов',
      desc: 'Серьёзная клиентская база',
      unlocked: clientCount >= 5,
      color: 'from-teal-400 to-emerald-500',
    },
    {
      id: 'first_doc',
      emoji: '📄',
      title: 'Первый документ',
      desc: 'Документооборот налажен',
      unlocked: documentCount >= 1,
      color: 'from-rose-400 to-pink-500',
    },
    {
      id: 'goal_set',
      emoji: '🎯',
      title: 'Цель поставлена',
      desc: 'Установлена месячная цель',
      unlocked: hasGoal,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      id: 'goal_reached',
      emoji: '🎉',
      title: 'Цель достигнута',
      desc: 'Месячный план выполнен',
      unlocked: goalReached,
      color: 'from-pink-400 to-rose-500',
    },
  ], [totalIncome, incomeCount, clientCount, documentCount, hasGoal, goalReached])

  const unlockedCount = badges.filter(b => b.unlocked).length
  const pct = Math.round((unlockedCount / badges.length) * 100)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-gray-900 text-sm">Достижения</p>
          <p className="text-xs text-gray-400 mt-0.5">{unlockedCount} из {badges.length} открыто</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-indigo-600">{pct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`relative flex flex-col items-center text-center p-3 rounded-2xl transition-all ${
              b.unlocked
                ? 'bg-gradient-to-br ' + b.color + ' shadow-sm'
                : 'bg-gray-50 border border-dashed border-gray-200'
            }`}
          >
            <span className={`text-2xl mb-1.5 ${b.unlocked ? '' : 'opacity-30 grayscale'}`}>
              {b.emoji}
            </span>
            <p className={`text-[10px] font-bold leading-tight ${b.unlocked ? 'text-white' : 'text-gray-400'}`}>
              {b.title}
            </p>
            {b.unlocked && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
