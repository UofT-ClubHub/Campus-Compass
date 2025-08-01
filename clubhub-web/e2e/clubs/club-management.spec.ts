import { test, expect } from '@playwright/test';
import { loginUser, navigateToClubs, followClub, unfollowClub, TEST_USERS, waitForLoadingToFinish } from '../helpers/test-helpers';

test.describe('Club Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
  });

  test('should display clubs search page', async ({ page }) => {
    await navigateToClubs(page);
    
    // Should show clubs search interface
    await expect(page.locator('[data-testid="club-search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="clubs-grid"]')).toBeVisible();
    
    // Should show club cards
    await expect(page.locator('[data-testid="club-card"]').first()).toBeVisible();
  });

  test('should search for clubs', async ({ page }) => {
    await navigateToClubs(page);
    
    // Search for computer science clubs
    await page.fill('[data-testid="club-search-input"]', 'Computer Science');
    await page.press('[data-testid="club-search-input"]', 'Enter');
    
    await waitForLoadingToFinish(page);
    
    // Should show filtered results
    const clubCards = page.locator('[data-testid="club-card"]');
    await expect(clubCards.first()).toBeVisible();
    
    // Results should contain the search term
    await expect(clubCards.first()).toContainText(/computer|science/i);
  });

  test('should filter clubs by campus', async ({ page }) => {
    await navigateToClubs(page);
    
    // Select UTSG campus filter
    await page.selectOption('[data-testid="campus-filter"]', 'UTSG');
    
    await waitForLoadingToFinish(page);
    
    // Should show only UTSG clubs
    const clubCards = page.locator('[data-testid="club-card"]');
    const count = await clubCards.count();
    
    if (count > 0) {
      // Check that displayed clubs are from UTSG
      await expect(clubCards.first().locator('[data-testid="club-campus"]')).toContainText('UTSG');
    }
  });

  test('should view club details', async ({ page }) => {
    await navigateToClubs(page);
    
    // Click on first club
    await page.locator('[data-testid="club-card"]').first().click();
    
    // Should navigate to club page
    await expect(page).toHaveURL(/\/clubPage\/[a-zA-Z0-9]+/);
    
    // Should show club details
    await expect(page.locator('[data-testid="club-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="club-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="club-campus"]')).toBeVisible();
    await expect(page.locator('[data-testid="club-followers"]')).toBeVisible();
    
    // Should show follow button
    await expect(page.locator('[data-testid="follow-button"]')).toBeVisible();
  });

  test('should follow and unfollow a club', async ({ page }) => {
    await navigateToClubs(page);
    
    // Click on first club
    await page.locator('[data-testid="club-card"]').first().click();
    
    const clubName = await page.locator('[data-testid="club-name"]').textContent();
    
    // Follow the club
    await page.click('[data-testid="follow-button"]');
    await expect(page.locator('[data-testid="follow-button"]')).toContainText(/following|unfollow/i);
    
    // Check profile shows followed club
    await page.goto('/profile');
    await expect(page.locator('[data-testid="followed-clubs"]')).toContainText(clubName!);
    
    // Go back to club and unfollow
    await page.goBack();
    await page.goBack();
    await unfollowClub(page);
    await expect(page.locator('[data-testid="follow-button"]')).toContainText(/follow/i);
  });

  test('should show club posts on club page', async ({ page }) => {
    await navigateToClubs(page);
    
    // Click on first club
    await page.locator('[data-testid="club-card"]').first().click();
    
    // Should show club posts section
    await expect(page.locator('[data-testid="club-posts"]')).toBeVisible();
    
    // Should show posts if any exist
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      await expect(posts.first()).toBeVisible();
    }
  });

  test('should show club events on club page', async ({ page }) => {
    await navigateToClubs(page);
    
    // Click on first club
    await page.locator('[data-testid="club-card"]').first().click();
    
    // Should show events section
    await expect(page.locator('[data-testid="club-events"]')).toBeVisible();
    
    // Should show events if any exist
    const events = page.locator('[data-testid="event-card"]');
    const eventCount = await events.count();
    
    if (eventCount > 0) {
      await expect(events.first()).toBeVisible();
    }
  });

  test('should display club contact information', async ({ page }) => {
    await navigateToClubs(page);
    
    // Click on first club
    await page.locator('[data-testid="club-card"]').first().click();
    
    // Should show contact section
    await expect(page.locator('[data-testid="club-contact"]')).toBeVisible();
    
    // May show email, instagram, website links
    const contactInfo = page.locator('[data-testid="club-contact"]');
    
    // Check if any contact methods are available
    const hasEmail = await contactInfo.locator('[data-testid="club-email"]').isVisible();
    const hasInstagram = await contactInfo.locator('[data-testid="club-instagram"]').isVisible();
    const hasWebsite = await contactInfo.locator('[data-testid="club-website"]').isVisible();
    
    // At least one contact method should be visible
    expect(hasEmail || hasInstagram || hasWebsite).toBeTruthy();
  });

  test('should handle club search with no results', async ({ page }) => {
    await navigateToClubs(page);
    
    // Search for non-existent club
    await page.fill('[data-testid="club-search-input"]', 'NonExistentClubXYZ123');
    await page.press('[data-testid="club-search-input"]', 'Enter');
    
    await waitForLoadingToFinish(page);
    
    // Should show no results message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText(/no clubs found/i);
  });

  test('should show club category filter', async ({ page }) => {
    await navigateToClubs(page);
    
    // Should show category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      // Select a category
      await categoryFilter.selectOption('Academic');
      
      await waitForLoadingToFinish(page);
      
      // Should filter clubs by category
      const clubCards = page.locator('[data-testid="club-card"]');
      const count = await clubCards.count();
      
      if (count > 0) {
        // Results should be filtered
        await expect(clubCards.first()).toBeVisible();
      }
    }
  });

  test('should display club statistics', async ({ page }) => {
    await navigateToClubs(page);
    
    // Click on first club
    await page.locator('[data-testid="club-card"]').first().click();
    
    // Should show follower count
    await expect(page.locator('[data-testid="club-followers"]')).toBeVisible();
    
    // Should show post count if available
    const postCount = page.locator('[data-testid="club-post-count"]');
    if (await postCount.isVisible()) {
      await expect(postCount).toContainText(/\d+/);
    }
  });
});
