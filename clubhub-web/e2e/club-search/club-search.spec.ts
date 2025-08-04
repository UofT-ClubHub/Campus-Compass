import { test, expect } from '@playwright/test';

test.describe('Club Search Page - Smoke Tests', () => {
  
  test('should load club search page successfully', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/clubSearch/);
    
    // Verify basic search elements are present
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
    
    console.log('Club search page loaded successfully');
  });

  test('should display basic page elements', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Check for any visible content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    // Check for any select elements (filters)
    const selectElements = page.locator('select');
    if (await selectElements.count() > 0) {
      await expect(selectElements.first()).toBeVisible();
    }
    
    console.log('Basic page elements are visible');
  });
}); 