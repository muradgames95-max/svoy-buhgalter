export interface TaxScenario {
  regime: string
  shortName: string
  tax: number
  contributions: number
  total: number
  effectiveRate: number
  available: boolean
  reason?: string
  details: string[]
  color: string
}

const FIXED_CONTRIBUTIONS_2026 = 53_658
const MAX_CONTRIBUTIONS_2026 = 277_571 + FIXED_CONTRIBUTIONS_2026

export function calcAllRegimes(income: number, expenses: number, hasEmployees: boolean): TaxScenario[] {
  const contrib1pct = Math.min(Math.max((income - 300_000) * 0.01, 0), 277_571)
  const totalContrib = FIXED_CONTRIBUTIONS_2026 + contrib1pct

  // НПД (самозанятый) — среднее 5% (50% физлица × 4% + 50% юрлица × 6%)
  const npdTax = Math.round(income * 0.05)
  const npdAvailable = income <= 2_400_000 && !hasEmployees
  const npd: TaxScenario = {
    regime: 'НПД (самозанятый)',
    shortName: 'НПД',
    tax: npdTax,
    contributions: 0,
    total: npdTax,
    effectiveRate: income > 0 ? (npdTax / income) * 100 : 0,
    available: npdAvailable,
    reason: !npdAvailable
      ? income > 2_400_000
        ? 'Доход превышает лимит НПД 2,4 млн руб.'
        : 'НПД не разрешает найм сотрудников'
      : undefined,
    details: [
      '4% с доходов от физлиц',
      '6% с доходов от юрлиц/ИП',
      'Нет страховых взносов',
      'Нет отчётности — только чеки',
      `Лимит: 2,4 млн руб./год`,
      'Расчёт: среднее ~5% (50/50 физлица/юрлица)',
    ],
    color: 'emerald',
  }

  // УСН Доходы 6%
  const usnIncomeTax = Math.round(income * 0.06)
  const usnIncomeDeduction = Math.min(usnIncomeTax, totalContrib)
  const usnIncomeTaxFinal = Math.max(usnIncomeTax - usnIncomeDeduction, 0)
  const usnIncome: TaxScenario = {
    regime: 'УСН «Доходы» 6%',
    shortName: 'УСН 6%',
    tax: usnIncomeTaxFinal,
    contributions: totalContrib,
    total: usnIncomeTaxFinal + totalContrib,
    effectiveRate: income > 0 ? ((usnIncomeTaxFinal + totalContrib) / income) * 100 : 0,
    available: income <= 450_000_000,
    details: [
      '6% от всех доходов',
      `Взносы ИП: ${Math.round(totalContrib / 1000)}к руб.`,
      'Налог можно уменьшить на взносы',
      `Вычет: −${Math.round(usnIncomeDeduction / 1000)}к руб.`,
      `Итого налог: ${Math.round(usnIncomeTaxFinal / 1000)}к руб.`,
    ],
    color: 'indigo',
  }

  // УСН Доходы минус расходы 15%
  const base = Math.max(income - expenses, 0)
  const usnDiffTax = Math.max(Math.round(base * 0.15), Math.round(income * 0.01))
  const usnDiff: TaxScenario = {
    regime: 'УСН «Д−Р» 15%',
    shortName: 'УСН 15%',
    tax: usnDiffTax,
    contributions: totalContrib,
    total: usnDiffTax + totalContrib,
    effectiveRate: income > 0 ? ((usnDiffTax + totalContrib) / income) * 100 : 0,
    available: income <= 450_000_000 && expenses > 0,
    reason: expenses === 0 ? 'Введите расходы для расчёта' : undefined,
    details: [
      '15% от (доходы − расходы)',
      `База: ${Math.round(base / 1000)}к руб.`,
      `Взносы ИП: ${Math.round(totalContrib / 1000)}к руб.`,
      'Выгоден при расходах > 60%',
      `Минимальный налог: 1% от дохода`,
    ],
    color: 'violet',
  }

  // ОСНО (упрощённо)
  const ndflBase = Math.max(income - expenses - totalContrib, 0)
  let ndfl = 0
  if (ndflBase <= 2_400_000) ndfl = Math.round(ndflBase * 0.13)
  else if (ndflBase <= 5_000_000) ndfl = Math.round(312_000 + (ndflBase - 2_400_000) * 0.15)
  else ndfl = Math.round(702_000 + (ndflBase - 5_000_000) * 0.18)
  const nds = Math.round(income * 0.22 / 1.22)
  const osno: TaxScenario = {
    regime: 'ОСНО',
    shortName: 'ОСНО',
    tax: ndfl + nds,
    contributions: totalContrib,
    total: ndfl + nds + totalContrib,
    effectiveRate: income > 0 ? ((ndfl + nds + totalContrib) / income) * 100 : 0,
    available: true,
    details: [
      `НДФЛ: ${Math.round(ndfl / 1000)}к руб. (13–18%)`,
      `НДС: ~${Math.round(nds / 1000)}к руб. (22%)`,
      `Взносы ИП: ${Math.round(totalContrib / 1000)}к руб.`,
      'Сложная отчётность',
      'Выгоден при работе с НДС-компаниями',
    ],
    color: 'rose',
  }

  // АУСН — доступен в Москве, МО, Калужской обл., Татарстане
  const ausnTax = Math.round(income * 0.08) // 8% доходы (нет взносов, нет деклараций)
  const ausn: TaxScenario = {
    regime: 'АУСН «Доходы» 8%',
    shortName: 'АУСН',
    tax: ausnTax,
    contributions: 0,
    total: ausnTax,
    effectiveRate: income > 0 ? (ausnTax / income) * 100 : 0,
    available: income <= 60_000_000,
    reason: income > 60_000_000 ? 'Доход превышает лимит АУСН 60 млн руб.' : undefined,
    details: [
      '8% с доходов (нет взносов)',
      'Доступен: Москва, МО, Калужская, Татарстан',
      'Нет деклараций, нет страховых взносов',
      'Выгоден при отсутствии расходов',
      `Лимит: 60 млн руб./год`,
    ],
    color: 'sky',
  }

  return [npd, usnIncome, usnDiff, ausn, osno].sort((a, b) => {
    if (!a.available && b.available) return 1
    if (a.available && !b.available) return -1
    return a.total - b.total
  })
}

export { FIXED_CONTRIBUTIONS_2026, MAX_CONTRIBUTIONS_2026 }
