export type TaxRegime = 'НПД' | 'УСН' | 'ИП' | 'Все'

export interface Deadline {
  id: string
  date: string
  title: string
  description: string
  regime: TaxRegime[]
  type: 'tax' | 'report' | 'contribution' | 'other'
  critical: boolean
}

export const DEADLINES_2026: Deadline[] = [
  {
    id: '1',
    date: '2026-01-28',
    title: 'НПД — налог за декабрь 2025',
    description: 'ФНС автоматически рассчитает и спишет налог по НПД за декабрь',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '2',
    date: '2026-02-28',
    title: 'НПД — налог за январь',
    description: 'Автосписание налога за январь из приложения «Мой налог»',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '3',
    date: '2026-03-28',
    title: 'НПД — налог за февраль',
    description: 'Автосписание налога за февраль',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '4',
    date: '2026-03-31',
    title: 'УСН — аванс за 2025 год (ООО)',
    description: 'Организации на УСН платят налог за 2025 год',
    regime: ['УСН'],
    type: 'tax',
    critical: true,
  },
  {
    id: '5',
    date: '2026-04-25',
    title: 'УСН — аванс за I квартал',
    description: 'ИП и ООО на УСН платят авансовый платёж за январь–март 2026',
    regime: ['УСН', 'ИП'],
    type: 'tax',
    critical: true,
  },
  {
    id: '6',
    date: '2026-04-25',
    title: 'УСН — декларация за 2025 год (ИП)',
    description: 'ИП сдают декларацию по УСН за 2025 год в налоговую',
    regime: ['УСН', 'ИП'],
    type: 'report',
    critical: true,
  },
  {
    id: '7',
    date: '2026-04-28',
    title: 'НПД — налог за март',
    description: 'Автосписание налога за март',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '8',
    date: '2026-05-28',
    title: 'НПД — налог за апрель',
    description: 'Автосписание налога за апрель',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '9',
    date: '2026-06-28',
    title: 'НПД — налог за май',
    description: 'Автосписание налога за май',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '10',
    date: '2026-07-01',
    title: 'ИП — страховые взносы 1% с превышения',
    description: '1% с дохода свыше 300 000 руб. за 2025 год — последний день оплаты',
    regime: ['ИП'],
    type: 'contribution',
    critical: true,
  },
  {
    id: '11',
    date: '2026-07-25',
    title: 'УСН — аванс за II квартал',
    description: 'ИП и ООО на УСН платят авансовый платёж за апрель–июнь 2026',
    regime: ['УСН', 'ИП'],
    type: 'tax',
    critical: true,
  },
  {
    id: '12',
    date: '2026-07-28',
    title: 'НПД — налог за июнь',
    description: 'Автосписание налога за июнь',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '13',
    date: '2026-08-28',
    title: 'НПД — налог за июль',
    description: 'Автосписание налога за июль',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '14',
    date: '2026-09-28',
    title: 'НПД — налог за август',
    description: 'Автосписание налога за август',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '15',
    date: '2026-10-25',
    title: 'УСН — аванс за III квартал',
    description: 'ИП и ООО на УСН платят авансовый платёж за июль–сентябрь 2026',
    regime: ['УСН', 'ИП'],
    type: 'tax',
    critical: true,
  },
  {
    id: '16',
    date: '2026-10-28',
    title: 'НПД — налог за сентябрь',
    description: 'Автосписание налога за сентябрь',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '17',
    date: '2026-11-28',
    title: 'НПД — налог за октябрь',
    description: 'Автосписание налога за октябрь',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '18',
    date: '2026-12-28',
    title: 'НПД — налог за ноябрь',
    description: 'Автосписание налога за ноябрь',
    regime: ['НПД'],
    type: 'tax',
    critical: false,
  },
  {
    id: '19',
    date: '2026-12-31',
    title: 'ИП — фиксированные страховые взносы',
    description: 'Последний день уплаты фиксированных взносов ИП (~53 658 руб.) за 2026 год',
    regime: ['ИП'],
    type: 'contribution',
    critical: true,
  },
  {
    id: '20',
    date: '2026-12-31',
    title: 'Патент — продление на 2027 год',
    description: 'Подать заявление на патент на следующий год нужно за 10 дней до начала действия',
    regime: ['ИП'],
    type: 'other',
    critical: false,
  },
]

export function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getUpcomingDeadlines(deadlines: Deadline[], days = 60): Deadline[] {
  return deadlines
    .filter((d) => {
      const diff = getDaysUntil(d.date)
      return diff >= 0 && diff <= days
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}
