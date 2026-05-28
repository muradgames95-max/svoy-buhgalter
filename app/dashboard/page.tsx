import AppShell from '@/components/layout/AppShell'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 pb-10">
          <div className="pt-6 pb-2">
            <h1 className="text-xl font-bold text-gray-900">Финансы 2026</h1>
            <p className="text-sm text-gray-500 mt-0.5">Доходы, расходы и аналитика</p>
          </div>
          <DashboardContent />
        </div>
      </div>
    </AppShell>
  )
}
