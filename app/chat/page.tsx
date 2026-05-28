import ChatInterface from '@/components/chat/ChatInterface'
import AppShell from '@/components/layout/AppShell'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
        {/* Dark header */}
        <div className="bg-gradient-to-r from-gray-950 to-indigo-950 border-b border-white/5 px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900">
            <MessageCircle className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">AI-консультант</p>
            <p className="text-xs text-gray-400">Налоги · НПД · УСН · 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Онлайн
          </div>
        </div>
        <ChatInterface />
      </div>
    </AppShell>
  )
}
