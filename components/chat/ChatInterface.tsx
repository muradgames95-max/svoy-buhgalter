'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, History, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import Markdown from '@/lib/markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Income { id: string; amount: number; isLegal: boolean; date: string; description: string; clientName?: string }
interface Expense { id: string; amount: number; category: string; date: string }
interface UserProfile { name?: string; executorStatus?: string; activity?: string; inn?: string }

const MAX_HISTORY = 30

function buildUserContext(): string {
  try {
    const profile = loadFromStorage<Partial<UserProfile>>(STORAGE_KEYS.PROFILE, {})
    const allIncomes = loadFromStorage<Income[]>(STORAGE_KEYS.INCOMES, [])
    const allExpenses = loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, [])

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    const incomes = allIncomes.filter((i) => parseInt(i.date?.split('-')[0] ?? '0') === currentYear)
    const expenses = allExpenses.filter((e) => parseInt(e.date?.split('-')[0] ?? '0') === currentYear)

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
    const totalTax = incomes.reduce((s, i) => s + (i.isLegal ? Math.round(i.amount * 0.06) : Math.round(i.amount * 0.04)), 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalIncome - totalTax - totalExpenses

    const thisMonthIncome = incomes
      .filter((i) => parseInt(i.date?.split('-')[1] ?? '0') === currentMonth)
      .reduce((s, i) => s + i.amount, 0)

    const NPD_LIMIT = 2_400_000
    const usagePct = totalIncome > 0 ? ((totalIncome / NPD_LIMIT) * 100).toFixed(1) : '0'

    // Top clients by revenue
    const clientMap: Record<string, number> = {}
    incomes.forEach((i) => {
      if (i.clientName) clientMap[i.clientName] = (clientMap[i.clientName] ?? 0) + i.amount
    })
    const topClients = Object.entries(clientMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amt]) => `${name} (${amt.toLocaleString('ru')} руб.)`)

    // Top expense categories
    const catMap: Record<string, number> = {}
    expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
    const topCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ${amt.toLocaleString('ru')} руб.`)

    const parts: string[] = []
    if (profile.name) parts.push(`Пользователь: ${profile.name}`)
    if (profile.executorStatus) parts.push(`Налоговый режим: ${profile.executorStatus}`)
    if (profile.activity) parts.push(`Вид деятельности: ${profile.activity}`)
    if (totalIncome > 0) {
      parts.push(`Доходы за ${currentYear} год: ${totalIncome.toLocaleString('ru')} руб.`)
      parts.push(`Налог НПД начислен: ${totalTax.toLocaleString('ru')} руб.`)
      parts.push(`Доходы за текущий месяц: ${thisMonthIncome.toLocaleString('ru')} руб.`)
      const isNpd = !profile.executorStatus || profile.executorStatus.toLowerCase().includes('нпд') || profile.executorStatus.toLowerCase().includes('самозанят')
      if (isNpd) parts.push(`Использование лимита НПД: ${usagePct}% из 2 400 000 руб.`)
    }
    if (totalExpenses > 0) {
      parts.push(`Расходы за ${currentYear} год: ${totalExpenses.toLocaleString('ru')} руб.`)
      parts.push(`Чистая прибыль (доход − налог − расходы): ${netProfit.toLocaleString('ru')} руб.`)
    }
    if (topClients.length > 0) {
      parts.push(`Топ клиентов: ${topClients.join(', ')}`)
    }
    if (topCats.length > 0) {
      parts.push(`Топ категорий расходов: ${topCats.join(', ')}`)
    }
    if (parts.length === 0) return ''
    return `\n\n## Данные пользователя (используй для персонализации ответов)\n${parts.join('\n')}`
  } catch {
    return ''
  }
}

function getQuickQuestions(profile: Partial<UserProfile>): string[] {
  const status = profile.executorStatus ?? ''
  if (status.includes('УСН')) return [
    'Когда платить авансовый платёж по УСН в 2026?',
    'Как уменьшить УСН на страховые взносы?',
    'Что изменилось по НДС для ИП на УСН в 2026?',
    'Как перейти с УСН на другой режим?',
  ]
  if (status.includes('ОСНО')) return [
    'Как платить НДС 22% в 2026 году?',
    'Прогрессивная шкала НДФЛ — как считать?',
    'Можно ли вернуть НДС при ОСНО?',
    'Стоит ли перейти с ОСНО на УСН?',
  ]
  return [
    'Я самозанятый, надо ли мне платить НДС в 2026?',
    'Какой режим выгоднее для фрилансера с доходом 1,5 млн/год?',
    'Когда платить авансовый платёж по УСН?',
    'Чем отличается НПД от ИП на УСН?',
  ]
}

// Extract suggested follow-up questions from the AI response
function extractSuggestions(text: string): string[] {
  // Look for questions in the last portion of the response
  const lines = text.split('\n').filter((l) => l.trim())
  const questions: string[] = []
  for (const line of lines) {
    const clean = line.replace(/^[-•*\d.)\s]+/, '').trim()
    if (clean.endsWith('?') && clean.length > 15 && clean.length < 100) {
      questions.push(clean)
    }
  }
  return questions.slice(0, 3)
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userContext, setUserContext] = useState('')
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [historyCount, setHistoryCount] = useState(0)
  const [limitError, setLimitError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ctx = buildUserContext()
    setUserContext(ctx)
    setProfile(loadFromStorage<Partial<UserProfile>>(STORAGE_KEYS.PROFILE, {}))
    // Load persisted history
    const saved = loadFromStorage<Message[]>(STORAGE_KEYS.CHAT_HISTORY, [])
    if (saved.length > 0) {
      setMessages(saved)
      setHistoryCount(saved.length)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
  }, [input])

  function persistMessages(msgs: Message[]) {
    const capped = msgs.slice(-MAX_HISTORY)
    saveToStorage(STORAGE_KEYS.CHAT_HISTORY, capped)
  }

  function clearHistory() {
    setMessages([])
    setSuggestions([])
    saveToStorage(STORAGE_KEYS.CHAT_HISTORY, [])
    setHistoryCount(0)
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return
    setSuggestions([])
    const userMessage: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setMessages([...newMessages, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userContext }),
      })

      if (!res.ok) {
        setMessages(newMessages)
        if (res.status === 429) {
          const data = await res.json() as { message?: string }
          setLimitError(data.message ?? 'Лимит вопросов исчерпан. Оформите подписку.')
        } else if (res.status === 401) {
          setLimitError('Необходимо войти в аккаунт.')
        } else {
          const errMsg: Message[] = [...newMessages, { role: 'assistant', content: 'Произошла ошибка. Попробуйте позже.' }]
          setMessages(errMsg)
          persistMessages(errMsg)
        }
        return
      }

      setLimitError(null)
      if (!res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: full }])
      }
      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: full }]
      setMessages(finalMessages)
      persistMessages(finalMessages)
      const sugg = extractSuggestions(full)
      if (sugg.length > 0) setSuggestions(sugg)
    } catch {
      const errMessages: Message[] = [...newMessages, { role: 'assistant', content: 'Произошла ошибка. Проверьте соединение и попробуйте снова.' }]
      setMessages(errMessages)
      persistMessages(errMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = getQuickQuestions(profile)

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-xl shadow-indigo-200">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.name ? `Привет, ${profile.name.split(' ')[0]}!` : 'Спросите всё о налогах'}
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">
                  {profile.executorStatus
                    ? `${profile.executorStatus} · знаю ваши данные`
                    : 'НПД, УСН, ОСНО, изменения 2026 — отвечу чётко и по делу'}
                </p>
              </div>
              {userContext && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Использую ваши финансовые данные
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-3 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-700 hover:text-indigo-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History banner */}
        {messages.length > 0 && historyCount > 0 && historyCount === messages.length && (
          <div className="flex items-center gap-2 justify-center">
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1.5">
              <History className="w-3 h-3" />
              История загружена · {messages.length} сообщений
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gray-950 flex items-center justify-center flex-shrink-0 mt-1 shadow">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            <div className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%] shadow-sm',
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
            )}>
              {msg.role === 'assistant' ? (
                msg.content
                  ? <Markdown content={msg.content} />
                  : <span className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Думаю...
                    </span>
              ) : msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-1 shadow">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Suggested follow-ups */}
        {!isLoading && suggestions.length > 0 && (
          <div className="flex flex-col gap-2 pl-11">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Уточняющие вопросы</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left px-3.5 py-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 text-sm text-indigo-700 hover:shadow-sm transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        {limitError && (
          <div className="max-w-3xl mx-auto mb-3 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">{limitError}</p>
            <Link
              href="/pricing"
              className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Тарифы
            </Link>
          </div>
        )}
        {messages.length > 0 && (
          <div className="max-w-3xl mx-auto mb-2 flex justify-end">
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Новый диалог
            </button>
          </div>
        )}
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
            }}
            placeholder="Задайте вопрос по налогам..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent overflow-y-auto bg-gray-50"
            style={{ minHeight: '48px', maxHeight: '128px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || !!limitError}
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0 shadow-sm shadow-indigo-200"
          >
            {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Не является юридической консультацией</p>
      </div>
    </div>
  )
}
