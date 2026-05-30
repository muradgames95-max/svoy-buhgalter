import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'test123'

test.describe('Authentication', () => {
  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="Email"]', 'invalid@example.com')
    await page.fill('input[placeholder="Пароль"]', 'wrongpassword')
    await page.getByRole('button', { name: /войти/i }).click()
    // Should stay on login or show error
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/login/)
  })

  test('register page or link exists', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: /регистр|создать|sign up/i })
    await expect(registerLink).toBeVisible()
  })
})
