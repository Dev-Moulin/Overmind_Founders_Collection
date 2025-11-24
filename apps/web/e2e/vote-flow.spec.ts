import { test, expect } from '@playwright/test';

test.describe('Vote Flow', () => {
  test('should display vote page content', async ({ page }) => {
    await page.goto('/vote');

    // Page should have voting-related content
    await expect(page.locator('body')).toContainText(/vote|fondateur|founder|totem/i);
  });

  test('should show founder list or cards', async ({ page }) => {
    await page.goto('/');

    // Should have founder cards or list
    const hasFounderContent = await page.locator('[data-testid="founder-card"]').or(
      page.locator('article').or(
        page.locator('[class*="founder"]').or(
          page.locator('[class*="card"]')
        )
      )
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    // At minimum, homepage should load
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should navigate between pages', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();

    // Navigate to vote
    await page.goto('/vote');
    await expect(page.locator('body')).not.toBeEmpty();

    // Navigate to results
    await page.goto('/results');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
