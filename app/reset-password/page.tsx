'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirm) return
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        setSuccess(true)
        setTimeout(() => router.replace('/login'), 3000)
      } else {
        setError(data.error ?? 'Ошибка сервера')
      }
    } catch {
      setError('Ошибка сети. Проверьте подключение.')
    }
    setLoading(false)
  }

  if (!token || !email) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Недействительная ссылка</h2>
          <p className="text-gray-400 text-sm">Запросите новую ссылку для сброса пароля.</p>
        </div>
        <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
          Запросить снова
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
      {success ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Пароль изменён</h2>
            <p className="text-gray-400 text-sm">Перенаправляем на страницу входа...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-white">Новый пароль</h2>
            <p className="text-gray-400 text-sm mt-1">для {email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Новый пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                className="w-full bg-white/8 border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Повторите пароль"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              disabled={loading || !password || !confirm}
              className={cn(
                'w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-900'
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Сохранить пароль
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 h-64" />}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Войти в аккаунт
          </Link>
        </div>
      </div>
    </div>
  )
}
