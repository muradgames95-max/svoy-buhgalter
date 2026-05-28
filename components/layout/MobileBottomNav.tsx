'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Home, TrendingUp, MessageCircle, Bell, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
import { DEADLINES_2026, getDaysUntil } from '@/lib/deadlines'

interface Income { id: string; amount: number }

const NPD_LIMIT = 2_400_000

const TABS = [
  { href: '/overview', icon: Home, label: 'Главная' },
  { href: '/dashboard', icon: TrendingUp, label: 'Финансы' },
  { href: '/chat', icon: MessageCircle, label: 'AI-чат' },
  { href: '/clients', icon: Users, label: 'Клиенты' },
  { href: '/deadlines', icon: Bell, label: 'Дедлайны' },
] as const

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [incomes, setIncomes] = useState<Income[]>([])

  useEffect(() => {
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, []))
  }, [])

  const urgentCount = useMemo(
    () => DEADLINES_2026.filter((d) => { const n = getDaysUntil(d.date); return n >= 0 && n <= 7 }).length,
    []
  )

  const showFinanceDot = useMemo(
    () => incomes.reduce((s, i) => s + i.amount, 0) / NPD_LIMIT > 0.75,
    [incomes]
  )

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-gray-950 border-t border-white/10">
      <div className="flex items-stretch h-16">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/overview' && pathname.startsWith(href))
          const isDeadlines = href === '/deadlines'
          const isFinances = href === '/dashboard'

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-indigo-400' : 'text-gray-500 active:text-gray-300'
              )}
            >
              {active && (
                <span className="absolute top-0 left-[20%] right-[20%] h-0.5 rounded-full bg-indigo-500" />
              )}
              <div className="relative">
                <Icon className="w-[22px] h-[22px]" />
                {isDeadlines && urgentCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {urgentCount > 9 ? '9+' : urgentCount}
                  </span>
                )}
                {isFinances && showFinanceDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-gray-950" />
                )}
              </div>
              <span className={cn('text-[10px] font-medium leading-none', active && 'font-semibold text-indigo-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
