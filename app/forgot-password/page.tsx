'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        setSent(true)
      } else {
        setError(data.error ?? 'Ошибка сервера')
      }
    } catch {
      setError('Ошибка сети. Проверьте подключение.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-900">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Свой Бухгалтер</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Письмо отправлено</h2>
                <p className="text-gray-400 text-sm">
                  Если аккаунт с адресом <span className="text-white font-medium">{email}</span> существует,
                  вы получите письмо со ссылкой для сброса пароля.
                </p>
              </div>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">Восстановление пароля</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Введите email, и мы отправим ссылку для сброса пароля
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full bg-white/8 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className={cn(
                    'w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                    'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-900'
                  )}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Отправить ссылку
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Вернуться ко входу
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
