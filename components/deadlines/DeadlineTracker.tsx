'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Bell, AlertTriangle, CheckCircle2, Filter, Mail, Loader2, CheckCircle } from 'lucide-react'
import { DEADLINES_2026, getDaysUntil, type TaxRegime } from '@/lib/deadlines'
import { cn } from '@/lib/utils'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'

const REGIMES: TaxRegime[] = ['Все', 'НПД', 'УСН', 'ИП', 'ОСНО']

const TYPE_COLORS: Record<string, string> = {
  tax: 'bg-indigo-100 text-indigo-700',
  report: 'bg-violet-100 text-violet-700',
  contribution: 'bg-emerald-100 text-emerald-700',
  other: 'bg-gray-100 text-gray-600',
}

const TYPE_LABELS: Record<string, string> = {
  tax: 'Налог',
  report: 'Отчётность',
  contribution: 'Взносы',
  other: 'Прочее',
}

function UrgencyBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-[11px] text-gray-400 font-medium">Прошло</span>
  if (days === 0) return <span className="text-[11px] text-red-600 font-bold animate-pulse">Сегодня!</span>
  if (days <= 7) return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{days} дн.</span>
  )
  if (days <= 30) return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{days} дн.</span>
  )
  return <span className="text-[11px] text-gray-400">{days} дн.</span>
}

export default function DeadlineTracker() {
  const [regime, setRegime] = useState<TaxRegime>('Все')
  const [showPast, setShowPast] = useState(false)
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  useEffect(() => {
    const profile = loadFromStorage<{ email?: string }>(STORAGE_KEYS.PROFILE, {})
    if (profile.email) setEmail(profile.email)
  }, [])

  async function sendReminder() {
    if (!email.includes('@')) return
    setEmailStatus('loading')
    try {
      const upcoming = DEADLINES_2026
        .filter((d) => { const n = getDaysUntil(d.date); return n >= 0 && n <= 30 })
        .sort((a, b) => a.date.localeCompare(b.date))
      const res = await fetch('/api/notify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, deadlines: upcoming }),
      })
      setEmailStatus(res.ok ? 'sent' : 'error')
    } catch {
      setEmailStatus('error')
    }
    setTimeout(() => setEmailStatus('idle'), 4000)
  }

  const filtered = DEADLINES_2026.filter((d) => {
    const days = getDaysUntil(d.date)
    if (!showPast && days < 0) return false
    if (regime === 'Все') return true
    return d.regime.includes(regime)
  }).sort((a, b) => a.date.localeCompare(b.date))

  const nextDeadline = DEADLINES_2026.filter((d) => getDaysUntil(d.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const thisWeek = DEADLINES_2026.filter((d) => { const n = getDaysUntil(d.date); return n >= 0 && n <= 7 }).length
  const thisMonth = DEADLINES_2026.filter((d) => { const n = getDaysUntil(d.date); return n >= 0 && n <= 30 }).length
  const total = DEADLINES_2026.filter((d) => getDaysUntil(d.date) >= 0).length

  const nextDays = nextDeadline ? getDaysUntil(nextDeadline.date) : 999

  return (
    <div className="space-y-4">
      {/* Email notification card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-semibold text-gray-900">Напоминания на email</p>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="ваш@email.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendReminder()}
            className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
          <button
            onClick={sendReminder}
            disabled={emailStatus === 'loading' || emailStatus === 'sent'}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0',
              emailStatus === 'sent'
                ? 'bg-emerald-600 text-white'
                : emailStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
            )}
          >
            {emailStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" />
             : emailStatus === 'sent' ? <><CheckCircle className="w-4 h-4" />Отправлено</>
             : emailStatus === 'error' ? 'Ошибка'
             : 'Отправить'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Получите список ближайших дедлайнов на почту</p>
      </div>

      {/* Next deadline banner */}
      {nextDeadline && (
        <div className={cn(
          'rounded-3xl p-5 border flex items-start gap-4',
          nextDays <= 7 ? 'bg-red-50 border-red-200' :
          nextDays <= 30 ? 'bg-amber-50 border-amber-200' :
          'bg-indigo-50 border-indigo-200'
        )}>
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
            nextDays <= 7 ? 'bg-red-600' : nextDays <= 30 ? 'bg-amber-500' : 'bg-indigo-600'
          )}>
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 mb-0.5 uppercase tracking-wide">Ближайший дедлайн</p>
            <p className="font-bold text-gray-900">{nextDeadline.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              {format(parseISO(nextDeadline.date), 'd MMMM yyyy', { locale: ru })}
              {nextDays > 0 && (
                <span className={cn(
                  'ml-2 font-bold',
                  nextDays <= 7 ? 'text-red-600' : nextDays <= 30 ? 'text-amber-600' : 'text-indigo-600'
                )}>
                  через {nextDays} дн.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Эта неделя', value: thisWeek, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Этот месяц', value: thisMonth, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'До конца года', value: total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm')}>
            <div className={cn('text-2xl font-bold', color)}>{value}</div>
            <div className="text-[11px] text-gray-400 mt-1 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
          {REGIMES.map((r) => (
            <button
              key={r}
              onClick={() => setRegime(r)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                regime === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowPast(!showPast)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-semibold transition-all shadow-sm',
            showPast
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          )}
        >
          <Filter className="w-3 h-3" />
          {showPast ? 'Скрыть прошедшие' : 'Показать прошедшие'}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400" />
            <p className="font-semibold text-gray-600 text-sm">Нет дедлайнов</p>
            <p className="text-xs mt-1">по выбранным фильтрам</p>
          </div>
        )}
        <div className="divide-y divide-gray-50">
          {filtered.map((d) => {
            const days = getDaysUntil(d.date)
            const isPast = days < 0
            return (
              <div
                key={d.id}
                className={cn(
                  'flex items-start gap-4 px-5 py-4',
                  isPast ? 'opacity-40' : '',
                  d.critical && !isPast && days <= 7 ? 'bg-red-50/50' : ''
                )}
              >
                {/* Date chip */}
                <div className={cn(
                  'w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white',
                  isPast ? 'bg-gray-300' :
                  days <= 7 ? 'bg-red-600' :
                  days <= 30 ? 'bg-amber-500' : 'bg-indigo-600'
                )}>
                  <span className="text-sm font-bold leading-none">{format(parseISO(d.date), 'd')}</span>
                  <span className="text-[9px] uppercase opacity-80 mt-0.5">{format(parseISO(d.date), 'MMM', { locale: ru })}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={cn('font-semibold text-sm', isPast ? 'text-gray-400' : 'text-gray-900')}>
                      {d.title}
                    </p>
                    {d.critical && !isPast && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{d.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', TYPE_COLORS[d.type])}>
                      {TYPE_LABELS[d.type]}
                    </span>
                    {d.regime.map((r) => (
                      <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  <UrgencyBadge days={days} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
