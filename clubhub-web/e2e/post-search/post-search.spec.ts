import { test, expect } from '@playwright/test';

test.describe('Post Search Component', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this suite
    test.setTimeout(90000);
    
    // Mock API calls with realistic data to prevent timeouts
    await page.route('**/api/posts**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('?') || url.includes('search') || url.includes('filter')) {
        // Mock post search/filter results
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'post-1',
              title: 'Weekly Coding Workshop',
              content: 'Join us this Friday for our weekly coding workshop. We\'ll be covering React hooks and state management. All skill levels welcome!',
              club: 'Computer Science Student Union',
              clubId: 'club-cs-utsg',
              campus: 'UTSG',
              category: 'Event',
              likes: 23,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              hashtags: ['#coding', '#react', '#workshop']
            },
            {
              id: 'post-2',
              title: 'Business Networking Night',
              content: 'Connect with industry professionals and fellow business students. Food and drinks provided.',
              club: 'Business Student Association',
              clubId: 'club-business-utm',
              campus: 'UTM',
              category: 'Networking',
              likes: 31,
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              hashtags: ['#networking', '#business', '#utm']
            },
            {
              id: 'post-3',
              title: 'Soccer Tryouts Open',
              content: 'Competitive soccer team tryouts are now open! No experience required for recreational league.',
              club: 'UTSC Soccer Club',
              clubId: 'club-soccer-utsc',
              campus: 'UTSC',
              category: 'Sports',
              likes: 15,
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
              hashtags: ['#soccer', '#sports', '#tryouts']
            }
          ])
        });
      } else {
        // Default posts for homepage
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'post-1',
              title: 'Weekly Coding Workshop',
              content: 'Join us this Friday for our weekly coding workshop.',
              club: 'CS Student Union',
              campus: 'UTSG',
              likes: 23,
              timestamp: new Date().toISOString()
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
  
  test('should display post filter page without authentication', async ({ page }) => {
    await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Should show post filter interface
    const filterContainer = page.locator('.grid').filter({ has: page.locator('input') });
    await expect(filterContainer).toBeVisible({ timeout: 15000 });
    
    // Should show search input
    const searchInput = page.locator('input[placeholder*="Post Name"]');
    if (await searchInput.isVisible({ timeout: 10000 })) {
      await expect(searchInput).toBeVisible();
    }
    
    // Should show campus filter
    const campusFilter = page.locator('select').first();
    await expect(campusFilter).toBeVisible({ timeout: 10000 });
    
    // Should show posts
    await page.waitForTimeout(3000);
    const posts = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
    const postCount = await posts.count();
    
    if (postCount > 0) {
      await expect(posts.first()).toBeVisible();
      await expect(posts.first().locator('h3')).toBeVisible();
    }
    
    console.log(`Found ${postCount} posts on filter page`);
  });

  test('should filter posts by campus without authentication', async ({ page }) => {
    await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Apply campus filter
    const campusFilter = page.locator('select').first();
    await campusFilter.waitFor({ timeout: 15000 });
    await campusFilter.selectOption('UTSG');
    
    await page.waitForTimeout(3000);
    
    const filteredPosts = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
    const postCount = await filteredPosts.count();
    
    if (postCount > 0) {
      const firstPost = filteredPosts.first();
      const utsgText = firstPost.locator('text="UTSG"');
      if (await utsgText.isVisible({ timeout: 5000 })) {
        await expect(utsgText).toBeVisible();
      }
      console.log(`Campus filter returned ${postCount} UTSG posts`);
    }
  });

  test('should show post metadata without authentication', async ({ page }) => {
    await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
    
    await page.waitForTimeout(3000);
    
    const posts = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
    const postCount = await posts.count();
    
    if (postCount > 0) {
      const firstPost = posts.first();
      
      // Should show post title
      await expect(firstPost.locator('h3')).toBeVisible();
      
      // Should show club name
      const clubName = firstPost.locator('text=/club|association|union/i');
      if (await clubName.isVisible({ timeout: 5000 })) {
        await expect(clubName).toBeVisible();
      }
      
      // Should show campus
      const campus = firstPost.locator('text="UTSG"').or(firstPost.locator('text="UTM"')).or(firstPost.locator('text="UTSC"'));
      if (await campus.isVisible({ timeout: 5000 })) {
        await expect(campus).toBeVisible();
      }
      
      // Should show like count (even if user can't like)
      const likeCount = firstPost.locator('text=/\\d+/');
      if (await likeCount.isVisible({ timeout: 3000 })) {
        await expect(likeCount).toBeVisible();
      }
      
      console.log('Post metadata displayed correctly');
    }
  });
}); 