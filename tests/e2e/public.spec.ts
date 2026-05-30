import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Пароль"]')).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('login form shows validation', async ({ page }) => {
    await page.goto('/login')
    const submitBtn = page.getByRole('button', { name: /войти/i })
    await submitBtn.click()
    // Should not navigate away on empty form
    await expect(page).toHaveURL(/login/)
  })
})
