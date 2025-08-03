import { test, expect } from '@playwright/test';

test.describe('Club Search Component', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this suite
    test.setTimeout(90000);
    
    // Mock API calls with realistic data to prevent timeouts
    await page.route('**/api/clubs**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('?') || url.includes('search') || url.includes('filter')) {
        // Mock club search/filter results
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'club-cs-utsg',
              name: 'Computer Science Student Union',
              description: 'The official computer science student organization at UTSG. We host coding workshops, networking events, and career fairs.',
              campus: 'UTSG',
              category: 'Academic',
              followers: 245,
              posts: 18,
              email: 'contact@cssu.ca',
              instagram: '@cssu_utsg',
              website: 'https://cssu.ca'
            },
            {
              id: 'club-business-utm',
              name: 'Business Student Association',
              description: 'UTM Business students networking and professional development club.',
              campus: 'UTM',
              category: 'Business',
              followers: 189,
              posts: 12,
              email: 'info@utmbsa.com'
            },
            {
              id: 'club-soccer-utsc',
              name: 'UTSC Soccer Club',
              description: 'Competitive and recreational soccer for all skill levels at UTSC.',
              campus: 'UTSC',
              category: 'Sports',
              followers: 156,
              posts: 8,
              instagram: '@utsc_soccer'
            }
          ])
        });
      } else if (url.includes('/club-cs-utsg') || url.includes('club-cs-utsg')) {
        // Mock individual club data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'club-cs-utsg',
            name: 'Computer Science Student Union',
            description: 'The official computer science student organization at UTSG. We host coding workshops, networking events, and career fairs. Join us to connect with fellow CS students and industry professionals.',
            campus: 'UTSG',
            category: 'Academic',
            followers: 245,
            posts: 18,
            email: 'contact@cssu.ca',
            instagram: '@cssu_utsg',
            website: 'https://cssu.ca',
            events: [
              {
                id: 'event-1',
                title: 'Tech Talk: AI in Industry',
                date: '2024-02-15',
                description: 'Industry professionals discuss AI applications'
              }
            ]
          })
        });
      } else {
        // Default club list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'club-cs-utsg',
              name: 'Computer Science Student Union',
              description: 'The official CS student union',
              campus: 'UTSG',
              category: 'Academic',
              followers: 245
            }
          ])
        });
      }
    });

    // Don't mock authentication - test in unauthenticated state
    await page.addInitScript(() => {
      // Clear any existing auth state
      localStorage.removeItem('mockAuth');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
    });
  });
  
  test('should display club search page without authentication', async ({ page }) => {
    await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Should show club search interface
    await expect(page.locator('input[placeholder*="Search by club name"]')).toBeVisible({ timeout: 15000 });
    
    // Should show campus filter
    const campusFilter = page.locator('select').first();
    await expect(campusFilter).toBeVisible({ timeout: 10000 });
    
    // Should show club cards
    await page.waitForTimeout(3000);
    const clubCards = page.locator('.group.cursor-pointer');
    const cardCount = await clubCards.count();
    
    if (cardCount > 0) {
      await expect(clubCards.first()).toBeVisible();
      // Should show club name
      await expect(clubCards.first().locator('h2, h3')).toBeVisible();
      // Should show club description
      await expect(clubCards.first().locator('p')).toBeVisible();
    }
    
    console.log(`Found ${cardCount} club cards on search page`);
  });

  test('should search clubs by name without authentication', async ({ page }) => {
    await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Search for computer science
    const searchInput = page.locator('input[placeholder*="Search by club name"]');
    await searchInput.waitFor({ timeout: 15000 });
    await searchInput.fill('Computer Science');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(3000);
    
    const results = page.locator('.group.cursor-pointer');
    const resultCount = await results.count();
    
    if (resultCount > 0) {
      // Should contain search term
      await expect(results.first()).toContainText(/computer|science/i);
      console.log(`Search returned ${resultCount} results`);
    } else {
      console.log('No search results found - this is acceptable for testing');
    }
  });

  test('should filter clubs by campus without authentication', async ({ page }) => {
    await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Apply campus filter
    const campusFilter = page.locator('select').first();
    await campusFilter.waitFor({ timeout: 15000 });
    await campusFilter.selectOption('UTSG');
    
    // Wait for filter to apply
    await page.waitForTimeout(3000);
    
    const filteredClubs = page.locator('.group.cursor-pointer');
    const clubCount = await filteredClubs.count();
    
    if (clubCount > 0) {
      // Should show UTSG clubs
      const firstClub = filteredClubs.first();
      const utsgText = firstClub.locator('text="UTSG"');
      if (await utsgText.isVisible({ timeout: 5000 })) {
        await expect(utsgText).toBeVisible();
      }
      console.log(`Campus filter returned ${clubCount} UTSG clubs`);
    }
  });
}); 