import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-2">Страница не найдена</p>
        <p className="text-gray-400 text-sm mb-8">
          Такой страницы не существует. Возможно, ссылка устарела или вы ошиблись адресом.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
          >
            Открыть AI-консультант
          </Link>
        </div>
      </div>
    </div>
  )
}
