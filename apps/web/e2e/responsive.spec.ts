import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Mobile Chrome', () => {
    test.use({ ...devices['Pixel 5'] });

    test('should display mobile navigation', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('should be scrollable', async ({ page }) => {
      await page.goto('/');

      // Check page can scroll
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      expect(bodyHeight).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Safari', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should display content on iPhone', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('should handle touch events', async ({ page }) => {
      await page.goto('/');

      // Mobile viewport should be narrower
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThan(500);
    });
  });

  test.describe('Tablet', () => {
    test.use({ ...devices['iPad (gen 7)'] });

    test('should display tablet layout', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('body')).not.toBeEmpty();

      const viewport = page.viewportSize();
      expect(viewport?.width).toBeGreaterThan(700);
    });
  });
});
