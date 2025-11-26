import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/INTUITION|Founders|Totem/i);
  });

  test('should have connect wallet button', async ({ page }) => {
    await page.goto('/');
    // Use header button specifically (there are 2 "Connect Wallet" buttons on homepage)
    const connectButton = page.getByRole('banner').getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should navigate to vote page', async ({ page }) => {
    await page.goto('/vote');
    await expect(page.locator('body')).toContainText(/vote|fondateur|founder/i);
  });

  test('should navigate to propose page', async ({ page }) => {
    await page.goto('/propose');
    await expect(page.locator('body')).toContainText(/propose|suggest|fondateur/i);
  });

  test('should navigate to results page', async ({ page }) => {
    await page.goto('/results');
    // Page uses French "Résultats"
    await expect(page.locator('body')).toContainText(/résultat|result|ranking|classement/i);
  });
});
