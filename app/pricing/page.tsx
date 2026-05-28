import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import PricingPageContent from '@/components/pricing/PricingPage'
import { CreditCard } from 'lucide-react'

export default function PricingPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 pb-10">
          <div className="relative rounded-b-3xl overflow-hidden bg-gradient-to-br from-gray-950 to-violet-950 px-6 pt-8 pb-7 mb-6">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900 shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Тарифы</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Первые 7 дней бесплатно · Отменить можно в любой момент
                </p>
              </div>
            </div>
          </div>
          <Suspense fallback={null}>
            <PricingPageContent />
          </Suspense>
        </div>
      </div>
    </AppShell>
  )
}
