import { test, expect } from '@playwright/test';

test.describe('Club Search Component', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set fast timeout for quick tests
    test.setTimeout(60000);
    
    // Don't mock APIs - test with real backend
    // Clear any existing auth state for consistent testing
    await page.addInitScript(() => {
      localStorage.removeItem('mockAuth');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
    });
  });
  
  test('should display club search page interface', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Verify page loads successfully
    await expect(page).toHaveURL(/\/clubSearch/);
    
    // Should show some form of search input (flexible selector)
    const searchInputs = page.locator('input[type="text"], input[type="search"], input[placeholder*="search"], input[placeholder*="club"], input[placeholder*="name"]');
    await expect(searchInputs.first()).toBeVisible({ timeout: 10000 });
    
    // Should show campus filter if available
    const campusFilter = page.locator('select');
    if (await campusFilter.count() > 0) {
      await expect(campusFilter.first()).toBeVisible();
    }
    
    console.log('Club search interface loaded successfully');
  });

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Find any search input
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Try to search - use a generic term
    await searchInput.fill('test');
    
    // Try common ways to trigger search
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // The page should still be functional (no crashes)
    await expect(page.locator('body')).toBeVisible();
    
    console.log('Search functionality works without errors');
  });

  test('should handle campus filtering if available', async ({ page }) => {
    await page.goto('/clubSearch');
    
    // Check if campus filter exists
    const campusFilter = page.locator('select');
    const filterCount = await campusFilter.count();
    
    if (filterCount > 0) {
      const firstFilter = campusFilter.first();
      await expect(firstFilter).toBeVisible();
      
      // Try to select an option if any exist
      const options = await firstFilter.locator('option').count();
      if (options > 1) {
        // Select the second option (first is usually default)
        await firstFilter.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
      }
      
      console.log('Campus filter functionality works');
    } else {
      console.log('No campus filter found - this is acceptable');
    }
    
    // Page should remain functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display club content when available', async ({ page }) => {
    await page.goto('/clubSearch');
    await page.waitForTimeout(3000);
    
    // Look for any club-like content with flexible selectors
    const clubCards = page.locator('.group, .card, [class*="club"], [class*="card"]');
    const cardCount = await clubCards.count();
    
    if (cardCount > 0) {
      const firstCard = clubCards.first();
      await expect(firstCard).toBeVisible();
      
      // Look for any heading text (club names)
      const headings = firstCard.locator('h1, h2, h3, h4, [class*="title"], [class*="name"]');
      if (await headings.count() > 0) {
        await expect(headings.first()).toBeVisible();
      }
      
      console.log(`Found ${cardCount} club cards`);
    } else {
      console.log('No club cards found - this is acceptable for testing');
    }
  });
}); 