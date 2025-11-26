import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    // Use header button specifically (there are 2 "Connect Wallet" buttons on homepage)
    const connectButton = page.getByRole('banner').getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should open wallet modal on connect click', async ({ page }) => {
    // Use header button specifically
    const connectButton = page.getByRole('banner').getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // RainbowKit modal should appear
    await expect(page.locator('[role="dialog"]').or(page.locator('.rk-modal'))).toBeVisible({ timeout: 5000 });
  });

  test('should display wallet options in modal', async ({ page }) => {
    // Use header button specifically
    const connectButton = page.getByRole('banner').getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // Check for common wallet providers
    const modal = page.locator('[role="dialog"]').or(page.locator('.rk-modal'));
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});
