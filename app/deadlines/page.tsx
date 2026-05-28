import AppShell from '@/components/layout/AppShell'
import DeadlineTracker from '@/components/deadlines/DeadlineTracker'
import NpdTaxSchedule from '@/components/tax/NpdTaxSchedule'
import EmailReminder from '@/components/deadlines/EmailReminder'
import { Bell } from 'lucide-react'

export default function DeadlinesPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 pb-10">
          <div className="relative rounded-b-3xl overflow-hidden bg-gradient-to-br from-gray-950 to-violet-950 px-6 pt-8 pb-7 mb-6">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900 shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Налоговый календарь 2026</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Все дедлайны для НПД, УСН и ИП — ничего не пропустишь
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <EmailReminder />
            <NpdTaxSchedule />
            <DeadlineTracker />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
