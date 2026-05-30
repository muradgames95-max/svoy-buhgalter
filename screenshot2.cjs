const { chromium } = require('playwright');
const SHELL = '/Users/macairm3/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const BASE = 'https://svoy-buhgalter.vercel.app';

(async () => {
  const browser = await chromium.launch({ executablePath: SHELL, headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const DEMO_INCOMES = JSON.stringify([
    { id:'1', description:'Разработка сайта', amount:120000, isLegal:false, date:'2026-05-01', clientName:'ООО Ромашка' },
    { id:'2', description:'Консультация SEO', amount:35000, isLegal:true, date:'2026-05-12', clientName:'ИП Иванов' },
    { id:'3', description:'Дизайн логотипа', amount:28000, isLegal:false, date:'2026-04-20' },
    { id:'4', description:'Мобильное приложение', amount:250000, isLegal:true, date:'2026-03-15', clientName:'ООО Ромашка' },
  ]);
  const DEMO_EXPENSES = JSON.stringify([
    { id:'1', description:'Figma подписка', amount:1900, category:'ПО и сервисы', date:'2026-05-02', recurring:true },
    { id:'2', description:'Реклама ВКонтакте', amount:15000, category:'Реклама', date:'2026-05-08' },
    { id:'3', description:'Хостинг', amount:890, category:'ПО и сервисы', date:'2026-05-01', recurring:true },
    { id:'4', description:'Курс по TypeScript', amount:12000, category:'Обучение', date:'2026-04-10' },
  ]);

  // Seed localStorage on login page (which loads fine)
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate((d) => {
    localStorage.setItem('sb_incomes', d.i);
    localStorage.setItem('sb_expenses', d.e);
    localStorage.setItem('sb_monthly_goal', '100000');
    localStorage.setItem('sb_annual_goal', '800000');
    localStorage.setItem('sb_notes', JSON.stringify(['Позвонить клиенту в среду', 'Оплатить налог до 28 июня']));
    localStorage.setItem('sb_expense_budgets', JSON.stringify({ 'Реклама': 20000, 'ПО и сервисы': 5000, 'Обучение': 15000 }));
    localStorage.setItem('sb_profile', JSON.stringify({ name:'Мурад Алиев', executorStatus:'НПД / Самозанятый', activity:'Разработка ПО' }));
  }, { i: DEMO_INCOMES, e: DEMO_EXPENSES });

  await page.screenshot({ path: '/tmp/sb_01_login.png' });
  console.log('✅ 01_login');

  // Forgot password
  await page.goto(BASE + '/forgot-password', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/tmp/sb_02_forgot.png' });
  console.log('✅ 02_forgot');

  // Overview (will redirect to login since no session, but localStorage is set)
  // Navigate to overview - middleware redirects to login
  // So screenshot the login + check overview renders with data via direct hash navigation
  // Actually overview needs auth. Let's show the pages that work without auth.

  // Signup
  await page.goto(BASE + '/signup', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/tmp/sb_03_signup.png' });
  console.log('✅ 03_signup');

  // Landing page
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/tmp/sb_04_landing.png' });
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/sb_05_landing2.png' });
  console.log('✅ 04-05_landing');

  await browser.close();
  console.log('Done!');
})().catch(e => { console.error(e.message); process.exit(1) });
