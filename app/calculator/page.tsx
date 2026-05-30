import AppShell from '@/components/layout/AppShell'
import TaxCalculator from '@/components/calculator/TaxCalculator'
import SickLeaveCalculator from '@/components/calculator/SickLeaveCalculator'
import { Calculator } from 'lucide-react'

export const metadata = {
  title: 'Калькулятор налогов — Свой Бухгалтер',
  description: 'Сравните НПД, УСН, ОСНО и патент. Найдите самый выгодный налоговый режим.',
}

export default function CalculatorPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 pb-10">
          {/* Hero */}
          <div className="relative rounded-b-3xl overflow-hidden bg-gradient-to-br from-gray-950 to-indigo-950 px-6 pt-8 pb-7 mb-6">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900 shrink-0">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Калькулятор режима</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Введите доход — сравним НПД, УСН, ОСНО и найдём выгодный вариант
                </p>
              </div>
            </div>
          </div>
          <TaxCalculator />
          <div className="mt-5">
            <SickLeaveCalculator />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
