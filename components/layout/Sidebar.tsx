'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  MessageCircle, TrendingUp, FileText, Bell, CreditCard,
  Home, Calculator, Sparkles, Users, LogOut, UserCircle, BarChart3,
  Sun, Moon,
} from 'lucide-react'
const PLAN_LABELS: Record<string, string> = { free: 'Бесплатно', self: 'Самозанятый', ip: 'ИП / ООО' }
import { cn } from '@/lib/utils'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
import { DEADLINES_2026, getDaysUntil } from '@/lib/deadlines'
import { toggleTheme, getTheme, initTheme, type Theme } from '@/lib/theme'

interface UserProfile { name?: string; executorStatus?: string }
interface Income { id: string; amount: number; date: string }

const NPD_LIMIT = 2_400_000

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface SubscriptionInfo {
  plan: string
  usage: { chatCount: number; docCount: number }
  limits: { aiQuestions: number | null; documents: number | null }
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile>({})
  const [incomes, setIncomes] = useState<Income[]>([])
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    setProfile(loadFromStorage<UserProfile>(STORAGE_KEYS.PROFILE, {}))
    setIncomes(loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, []))
    initTheme()
    setThemeState(getTheme())
  }, [])

  useEffect(() => {
    if (!session) return
    fetch('/api/subscription')
      .then((r) => r.json())
      .then((d: SubscriptionInfo) => setSub(d))
      .catch(() => null)
  }, [session])

  const urgentDeadlineCount = useMemo(() =>
    DEADLINES_2026.filter((d) => { const n = getDaysUntil(d.date); return n >= 0 && n <= 7 }).length,
    []
  )

  const npdUsagePct = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return incomes
      .filter((i) => parseInt(i.date.split('-')[0]) === currentYear)
      .reduce((s, i) => s + i.amount, 0) / NPD_LIMIT
  }, [incomes])

  const showFinancesAlert = npdUsagePct > 0.75

  // Display name: Google session > localStorage profile > fallback
  const displayName = session?.user?.name ?? profile.name ?? 'Профиль'
  const displayEmail = session?.user?.email ?? ''
  const avatarUrl = session?.user?.image ?? null
  const initials = displayName !== 'Профиль' ? getInitials(displayName) : '?'

  const NAV = [
    { href: '/overview', icon: Home, label: 'Главная' },
    { href: '/chat', icon: MessageCircle, label: 'AI-консультант' },
    { href: '/dashboard', icon: TrendingUp, label: 'Финансы', dot: showFinancesAlert ? 'yellow' as const : null, badge: null },
    { href: '/clients', icon: Users, label: 'Клиенты' },
    { href: '/calculator', icon: Calculator, label: 'Калькулятор' },
    { href: '/documents', icon: FileText, label: 'Документы' },
    { href: '/reports', icon: BarChart3, label: 'Отчёты' },
    { href: '/deadlines', icon: Bell, label: 'Дедлайны', badge: urgentDeadlineCount > 0 ? urgentDeadlineCount : null },
    { href: '/pricing', icon: CreditCard, label: 'Тариф' },
  ]

  return (
    <aside className="w-56 shrink-0 bg-gray-950 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Свой Бухгалтер</p>
            <p className="text-xs text-gray-500">AI для самозанятых</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label, badge, dot }) => {
          const active = pathname === href || (href !== '/overview' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-gray-500')} />
              <span className="flex-1">{label}</span>
              {badge != null && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {badge == null && dot === 'yellow' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan / usage */}
      {sub && sub.plan === 'free' && (
        <div className="mx-3 mb-2 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              {PLAN_LABELS[sub.plan] ?? sub.plan}
            </span>
            <Link href="/pricing" className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Upgrade →
            </Link>
          </div>
          {sub.limits.aiQuestions != null && (
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>AI-вопросы</span>
                <span>{sub.usage.chatCount} / {sub.limits.aiQuestions}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min((sub.usage.chatCount / sub.limits.aiQuestions) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          {sub.limits.documents != null && (
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Документы</span>
                <span>{sub.usage.docCount} / {sub.limits.documents}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min((sub.usage.docCount / sub.limits.documents) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {sub && sub.plan !== 'free' && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-indigo-300">{PLAN_LABELS[sub.plan] ?? sub.plan}</span>
          <span className="text-[10px] text-indigo-400">∞ лимиты</span>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all',
            pathname.startsWith('/profile') ? 'bg-white/10' : 'hover:bg-white/5'
          )}
        >
          <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow">
            {avatarUrl
              ? <Image src={avatarUrl} alt={displayName} width={28} height={28} className="object-cover w-full h-full" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">{initials}</span>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{displayEmail || profile.executorStatus || 'Настройки профиля'}</p>
          </div>
          <UserCircle className="w-3.5 h-3.5 text-gray-600 shrink-0" />
        </Link>

        <button
          onClick={() => {
            const next = toggleTheme()
            setThemeState(next)
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>

        {session && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти
          </button>
        )}
      </div>
    </aside>
  )
}
