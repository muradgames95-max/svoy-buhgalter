const { chromium } = require('playwright')
const path = require('path')

const EXEC = path.join(
  process.env.HOME,
  'Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell'
)
const BASE = 'https://svoy-buhgalter.vercel.app'
const OUT = '/tmp'

const INCOMES = [
  { id: '1', description: 'Разработка лендинга', amount: 120000, date: '2026-05-01', isLegal: true },
  { id: '2', description: 'Консультация по SEO', amount: 35000, date: '2026-05-05', isLegal: true },
  { id: '3', description: 'Дизайн логотипа', amount: 28000, date: '2026-05-10', isLegal: false },
  { id: '4', description: 'Корпоративный сайт', amount: 250000, date: '2026-05-15', isLegal: true },
  { id: '5', description: 'Техподдержка', amount: 45000, date: '2026-05-20', isLegal: true },
]
const EXPENSES = [
  { id: '1', description: 'Adobe Creative Cloud', amount: 3500, date: '2026-05-01', category: 'ПО' },
  { id: '2', description: 'Аренда офиса', amount: 25000, date: '2026-05-01', category: 'Аренда' },
  { id: '3', description: 'Реклама ВКонтакте', amount: 8000, date: '2026-05-10', category: 'Реклама' },
  { id: '4', description: 'Интернет и телефон', amount: 2500, date: '2026-05-05', category: 'Связь' },
  { id: '5', description: 'Ноутбук', amount: 85000, date: '2026-05-12', category: 'Оборудование' },
]
const BUDGETS = { 'ПО': 5000, 'Аренда': 30000, 'Реклама': 15000, 'Связь': 3000, 'Оборудование': 100000 }
const NOTES = ['Сдать отчёт до 30 мая', 'Позвонить клиенту ООО Ромашка', 'Обновить портфолио']

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false })
  console.log('✓', name)
}

async function seed(page) {
  await page.evaluate((data) => {
    localStorage.setItem('sb_onboarding_done', 'true')
    localStorage.setItem('sb_incomes', JSON.stringify(data.incomes))
    localStorage.setItem('sb_expenses', JSON.stringify(data.expenses))
    localStorage.setItem('sb_monthly_goal', '150000')
    localStorage.setItem('sb_annual_goal', '1200000')
    localStorage.setItem('sb_notes', JSON.stringify(data.notes))
    localStorage.setItem('sb_expense_budgets', JSON.stringify(data.budgets))
    localStorage.setItem('sb_settings', JSON.stringify({ taxRegime: 'npd', usd: 91, eur: 99 }))
    localStorage.setItem('sb_profile', JSON.stringify({ name: 'Иван Петров', taxRegime: 'npd' }))
  }, { incomes: INCOMES, expenses: EXPENSES, notes: NOTES, budgets: BUDGETS })
}

;(async () => {
  const browser = await chromium.launch({
    executablePath: EXEC,
    args: ['--ignore-certificate-errors', '--no-sandbox'],
  })

  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } })
  ctx.setDefaultNavigationTimeout(45000)

  const page = await ctx.newPage()

  // --- LOGIN ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.fill('input[placeholder="Email"]', 'screenshot@demo.com')
  await page.fill('input[placeholder="Пароль"]', 'Demo12345')
  await page.click('button:has-text("Войти")')
  await page.waitForTimeout(4000)
  console.log('after login:', page.url())

  // Seed localStorage wherever we landed
  await seed(page)

  // --- OVERVIEW ---
  await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await shot(page, 'sb_02_overview_top.png')

  await page.evaluate(() => window.scrollBy(0, 450))
  await page.waitForTimeout(600)
  await shot(page, 'sb_03_overview_goals.png')

  await page.evaluate(() => window.scrollBy(0, 450))
  await page.waitForTimeout(600)
  await shot(page, 'sb_04_overview_converter.png')

  // --- DASHBOARD (income tab) ---
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await shot(page, 'sb_05_income_top.png')

  await page.evaluate(() => window.scrollBy(0, 500))
  await page.waitForTimeout(600)
  await shot(page, 'sb_06_income_list.png')

  // --- EXPENSES TAB ---
  // Try to click on Expenses/Расходы tab
  const expTabSelectors = ['button:has-text("Расходы")', 'a:has-text("Расходы")', '[role="tab"]:has-text("Расход")']
  for (const sel of expTabSelectors) {
    const el = page.locator(sel).first()
    const visible = await el.isVisible().catch(() => false)
    if (visible) { await el.click(); break }
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  await shot(page, 'sb_07_expenses_top.png')

  await page.evaluate(() => window.scrollBy(0, 600))
  await page.waitForTimeout(600)
  await shot(page, 'sb_08_expenses_budgets.png')

  // --- SUMMARY/ИТОГИ TAB ---
  const sumSelectors = ['button:has-text("Итоги")', 'button:has-text("Сводка")', '[role="tab"]:has-text("Итог")']
  for (const sel of sumSelectors) {
    const el = page.locator(sel).first()
    const visible = await el.isVisible().catch(() => false)
    if (visible) { await el.click(); break }
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  await shot(page, 'sb_09_summary.png')

  await page.evaluate(() => window.scrollBy(0, 500))
  await page.waitForTimeout(600)
  await shot(page, 'sb_10_donut.png')

  // --- REPORTS ---
  await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await shot(page, 'sb_11_reports.png')

  await browser.close()
  console.log('\nAll done!')
})()
