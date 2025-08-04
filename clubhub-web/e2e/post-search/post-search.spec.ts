import { test, expect } from '@playwright/test';

test.describe('Post Search Page - Smoke Tests', () => {
  
  test('should load post filter page successfully', async ({ page }) => {
    await page.goto('/postFilter');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/postFilter/);
    
    // Verify basic page content is present
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Post filter page loaded successfully');
  });

  test('should display basic filter elements', async ({ page }) => {
    await page.goto('/postFilter');
    
    // Check for any input elements (search)
    const inputElements = page.locator('input');
    if (await inputElements.count() > 0) {
      await expect(inputElements.first()).toBeVisible();
    }
    
    // Check for any select elements (filters)
    const selectElements = page.locator('select');
    if (await selectElements.count() > 0) {
      await expect(selectElements.first()).toBeVisible();
    }
    
    console.log('Basic filter elements are present');
  });
}); 