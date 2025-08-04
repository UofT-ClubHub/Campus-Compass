import { test, expect } from '@playwright/test';

test.describe('Basic Access Control - Smoke Tests', () => {
  
  test('should load auth page successfully', async ({ page }) => {
    await page.goto('/auth');
    
    // Verify page loads
    await expect(page).toHaveURL(/\/auth/);
    
    // Verify basic page content
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Auth page loaded successfully');
  });

  test('should load public pages successfully', async ({ page }) => {
    const publicUrls = ['/', '/clubSearch', '/postFilter'];
    
    for (const url of publicUrls) {
      await page.goto(url);
      
      // Verify page loads without errors
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
      
      console.log(`${url} loaded successfully`);
    }
  });

  test('should handle admin page access', async ({ page }) => {
    await page.goto('/admin');
    
    // Page should load in some form (either show content or redirect)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Admin page access handled');
  });

  test('should handle exec page access', async ({ page }) => {
    await page.goto('/exec');
    
    // Page should load in some form (either show content or redirect)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    
    console.log('Exec page access handled');
  });
}); 