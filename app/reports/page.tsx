import AppShell from '@/components/layout/AppShell'
import ReportGenerator from '@/components/reports/ReportGenerator'

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Отчёты</h1>
          <p className="text-gray-500 text-sm mt-1">Квартальные и годовые сводки по доходам, расходам и налогам</p>
        </div>
        <ReportGenerator />
      </div>
    </AppShell>
  )
}
