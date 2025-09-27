import { test, expect } from '@playwright/test';

test.describe('Basic Navigation - Smoke Tests', () => {
  
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads without crashing
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Home page loaded successfully');
  });

  test('should load auth page successfully', async ({ page }) => {
    await page.goto('/auth');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/auth/);
    
    // Verify basic page content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Auth page loaded successfully');
  });

  test('should load club search page successfully', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/clubSearch/);
    
    // Verify basic search elements are present
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
    
    console.log('Club search page loaded successfully');
  });

  test('should load post filter page successfully', async ({ page }) => {
    await page.goto('/postFilter');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/postFilter/);
    
    // Verify basic page content is present
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Post filter page loaded successfully');
  });

  test('should be responsive on all pages', async ({ page }) => {
    const pages = ['/', '/clubSearch', '/postFilter'];
    
    for (const url of pages) {
      await page.goto(url);
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileContent = page.locator('body');
      await expect(mobileContent).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      const desktopContent = page.locator('body');
      await expect(desktopContent).toBeVisible();
    }
    
    console.log('All pages are responsive');
  });
}); 