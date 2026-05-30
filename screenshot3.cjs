const { chromium } = require('playwright');
const SHELL = '/Users/macairm3/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const BASE = 'https://svoy-buhgalter.vercel.app';

(async () => {
  const browser = await chromium.launch({ executablePath: SHELL, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // === Логин ===
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"]', 'screenshot@demo.com');
  await page.fill('input[type="password"]', 'Demo12345');
  await page.screenshot({ path: '/tmp/sb_01_login.png' });
  console.log('✅ 01_login_filled');

  await page.click('button[type="submit"]');
  await page.waitForURL('**/overview', { timeout: 15000 });
  console.log('✅ Logged in, on overview');

  // === Seed localStorage ===
  const DEMO_INCOMES = [
    { id:'1', description:'Разработка сайта', amount:120000, isLegal:false, date:'2026-05-01', clientName:'ООО Ромашка' },
    { id:'2', description:'Консультация SEO', amount:35000, isLegal:true, date:'2026-05-12', clientName:'ИП Иванов' },
    { id:'3', description:'Дизайн логотипа', amount:28000, isLegal:false, date:'2026-04-20' },
    { id:'4', description:'Мобильное приложение', amount:250000, isLegal:true, date:'2026-03-15', clientName:'ООО Ромашка' },
    { id:'5', description:'Верстка лендинга', amount:45000, isLegal:false, date:'2026-02-10' },
  ];
  const DEMO_EXPENSES = [
    { id:'1', description:'Figma подписка', amount:1900, category:'ПО и сервисы', date:'2026-05-02', recurring:true },
    { id:'2', description:'Реклама ВКонтакте', amount:15000, category:'Реклама', date:'2026-05-08' },
    { id:'3', description:'Хостинг сервера', amount:890, category:'ПО и сервисы', date:'2026-05-01', recurring:true },
    { id:'4', description:'Курс по TypeScript', amount:12000, category:'Обучение', date:'2026-04-10' },
    { id:'5', description:'Аренда рабочего места', amount:8000, category:'Аренда', date:'2026-04-01' },
  ];

  await page.evaluate((d) => {
    localStorage.setItem('sb_incomes', JSON.stringify(d.incomes));
    localStorage.setItem('sb_expenses', JSON.stringify(d.expenses));
    localStorage.setItem('sb_monthly_goal', '150000');
    localStorage.setItem('sb_annual_goal', '1200000');
    localStorage.setItem('sb_notes', JSON.stringify(['Позвонить ООО Ромашка в пятницу', 'Оплатить налог до 28 июня']));
    localStorage.setItem('sb_expense_budgets', JSON.stringify({ 'Реклама': 20000, 'ПО и сервисы': 5000, 'Обучение': 15000 }));
    localStorage.setItem('sb_profile', JSON.stringify({ name:'Мурад Алиев', executorStatus:'НПД / Самозанятый', activity:'Разработка ПО' }));
  }, { incomes: DEMO_INCOMES, expenses: DEMO_EXPENSES });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // === Overview top ===
  await page.screenshot({ path: '/tmp/sb_02_overview_top.png' });
  console.log('✅ 02_overview_top');

  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/sb_03_overview_goals.png' });
  console.log('✅ 03_overview_goals+notes');

  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/sb_04_overview_converter.png' });
  console.log('✅ 04_overview_converter');

  // === Dashboard - Income ===
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/sb_05_income_top.png' });
  console.log('✅ 05_income_top');

  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/sb_06_income_list.png' });
  console.log('✅ 06_income_list');

  // === Dashboard - Expenses ===
  await page.evaluate(() => window.scrollTo(0, 0));
  const expBtn = await page.$('button:has-text("Расходы")');
  if (expBtn) { await expBtn.click(); await page.waitForTimeout(800); }
  await page.screenshot({ path: '/tmp/sb_07_expenses_top.png' });
  console.log('✅ 07_expenses_top');

  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/sb_08_expenses_budgets.png' });
  console.log('✅ 08_expenses_budgets');

  // === Dashboard - Summary (Donut) ===
  await page.evaluate(() => window.scrollTo(0, 0));
  const sumBtn = await page.$('button:has-text("Сводка")');
  if (sumBtn) { await sumBtn.click(); await page.waitForTimeout(800); }
  await page.screenshot({ path: '/tmp/sb_09_summary.png' });
  console.log('✅ 09_summary');

  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/sb_10_donut.png' });
  console.log('✅ 10_donut_chart');

  // === Reports ===
  await page.goto(BASE + '/reports', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/sb_11_reports.png' });
  console.log('✅ 11_reports');

  await browser.close();
  console.log('\n🎉 All screenshots saved!');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1) });
