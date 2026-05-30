'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Нет соединения</h1>
        <p className="text-gray-400 text-sm mb-6">
          Вы офлайн. Ваши данные сохранены локально и синхронизируются автоматически при восстановлении сети.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}
