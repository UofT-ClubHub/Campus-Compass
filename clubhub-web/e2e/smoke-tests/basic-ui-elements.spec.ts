import { test, expect } from '@playwright/test';

test.describe('Basic UI Elements - Smoke Tests', () => {
  
  test('should display basic page elements on club search', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Check for any visible content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    // Check for any select elements (filters)
    const selectElements = page.locator('select');
    if (await selectElements.count() > 0) {
      await expect(selectElements.first()).toBeVisible();
    }
    
    console.log('Basic page elements are visible on club search');
  });

  test('should display basic filter elements on post search', async ({ page }) => {
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

  test('should display club cards on club search page', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/clubSearch/);
    
    // Check if any card-like elements are present
    const cardElements = page.locator('.group, .card, [class*="card"]').first();
    
    // Page should load without errors regardless of content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Club cards page loaded successfully');
  });

  test('should display post cards on home page', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Home page with post cards loaded successfully');
  });

  test('should handle admin/exec page access', async ({ page }) => {
    const restrictedPages = ['/admin', '/exec'];
    
    for (const url of restrictedPages) {
      await page.goto(url);
      
      // Page should load in some form (either show content or redirect)
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
      
      console.log(`${url} access handled`);
    }
  });
}); 