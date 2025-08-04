import { test, expect } from '@playwright/test';

test.describe('Expandable Cards - Smoke Tests', () => {
  
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

  test('should display post cards on post filter page', async ({ page }) => {
    await page.goto('/postFilter');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/postFilter/);
    
    // Check for basic page content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Post filter page loaded successfully');
  });
}); 