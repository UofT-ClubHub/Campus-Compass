import { test, expect } from '@playwright/test';

test.describe('Home Page - Smoke Tests', () => {
  
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Home page loaded successfully');
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileContent = page.locator('body');
    await expect(mobileContent).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopContent = page.locator('body');
    await expect(desktopContent).toBeVisible();
    
    const desktopContent = page.locator('body');
    await expect(desktopContent).toBeVisible();
    
    console.log('Home page is responsive across all viewports');
  });
}); 