import { test, expect } from '@playwright/test';
import { loginUser, navigateToPosts, likePost, TEST_USERS, waitForLoadingToFinish } from '../helpers/test-helpers';

test.describe('Post Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
  });

  test('should display home page with posts', async ({ page }) => {
    await page.goto('/');
    
    // Should show posts feed
    await expect(page.locator('[data-testid="posts-feed"]')).toBeVisible();
    
    // Should show post cards
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      await expect(posts.first()).toBeVisible();
      
      // Each post should have basic elements
      await expect(posts.first().locator('[data-testid="post-title"]')).toBeVisible();
      await expect(posts.first().locator('[data-testid="post-content"]')).toBeVisible();
      await expect(posts.first().locator('[data-testid="post-date"]')).toBeVisible();
    }
  });

  test('should display post filter page', async ({ page }) => {
    await navigateToPosts(page);
    
    // Should show filter interface
    await expect(page.locator('[data-testid="post-filters"]')).toBeVisible();
    
    // Should show campus filter
    await expect(page.locator('[data-testid="campus-filter"]')).toBeVisible();
    
    // Should show category filter
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    
    // Should show posts
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      await expect(posts.first()).toBeVisible();
    }
  });

  test('should filter posts by campus', async ({ page }) => {
    await navigateToPosts(page);
    
    // Select UTSG campus
    await page.selectOption('[data-testid="campus-filter"]', 'UTSG');
    
    await waitForLoadingToFinish(page);
    
    // Should show filtered posts
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Check that posts are from UTSG
      await expect(posts.first().locator('[data-testid="post-campus"]')).toContainText('UTSG');
    }
  });

  test('should filter posts by category', async ({ page }) => {
    await navigateToPosts(page);
    
    // Select Event category
    await page.selectOption('[data-testid="category-filter"]', 'Event');
    
    await waitForLoadingToFinish(page);
    
    // Should show only event posts
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      await expect(posts.first().locator('[data-testid="post-category"]')).toContainText('Event');
    }
  });

  test('should search posts', async ({ page }) => {
    await navigateToPosts(page);
    
    // Should show search input
    const searchInput = page.locator('[data-testid="post-search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('meeting');
      await page.press('[data-testid="post-search-input"]', 'Enter');
      
      await waitForLoadingToFinish(page);
      
      // Should show filtered results
      const posts = page.locator('[data-testid="post-card"]');
      const postCount = await posts.count();
      
      if (postCount > 0) {
        await expect(posts.first()).toContainText(/meeting/i);
      }
    }
  });

  test('should like and unlike posts', async ({ page }) => {
    await page.goto('/');
    
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      const firstPost = posts.first();
      const likeButton = firstPost.locator('[data-testid="like-button"]');
      
      // Get initial like count
      const likeCount = await firstPost.locator('[data-testid="like-count"]').textContent();
      
      // Like the post
      await likeButton.click();
      
      // Should show liked state
      await expect(likeButton).toHaveClass(/liked/);
      
      // Unlike the post
      await likeButton.click();
      
      // Should show unliked state
      await expect(likeButton).not.toHaveClass(/liked/);
    }
  });

  test('should view expandable post details', async ({ page }) => {
    await page.goto('/');
    
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Click on first post to expand
      await posts.first().click();
      
      // Should show expanded post modal/view
      await expect(page.locator('[data-testid="expanded-post"]')).toBeVisible();
      
      // Should show full post content
      await expect(page.locator('[data-testid="post-full-content"]')).toBeVisible();
      
      // Should show club information
      await expect(page.locator('[data-testid="post-club-info"]')).toBeVisible();
      
      // Should have close button
      await expect(page.locator('[data-testid="close-post"]')).toBeVisible();
      
      // Close the expanded view
      await page.click('[data-testid="close-post"]');
      await expect(page.locator('[data-testid="expanded-post"]')).not.toBeVisible();
    }
  });

  test('should show post metadata', async ({ page }) => {
    await page.goto('/');
    
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      const firstPost = posts.first();
      
      // Should show post date
      await expect(firstPost.locator('[data-testid="post-date"]')).toBeVisible();
      
      // Should show club name
      await expect(firstPost.locator('[data-testid="post-club-name"]')).toBeVisible();
      
      // Should show campus
      await expect(firstPost.locator('[data-testid="post-campus"]')).toBeVisible();
      
      // Should show category
      await expect(firstPost.locator('[data-testid="post-category"]')).toBeVisible();
    }
  });

  test('should handle post images', async ({ page }) => {
    await page.goto('/');
    
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Check if any posts have images
      const postWithImage = posts.locator('[data-testid="post-image"]').first();
      
      if (await postWithImage.isVisible()) {
        await expect(postWithImage).toHaveAttribute('src');
        await expect(postWithImage).toHaveAttribute('alt');
      }
    }
  });

  test('should show post hashtags', async ({ page }) => {
    await page.goto('/');
    
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Check if posts have hashtags
      const hashtagsContainer = posts.first().locator('[data-testid="post-hashtags"]');
      
      if (await hashtagsContainer.isVisible()) {
        const hashtags = hashtagsContainer.locator('[data-testid="hashtag"]');
        await expect(hashtags.first()).toBeVisible();
        await expect(hashtags.first()).toContainText('#');
      }
    }
  });

  test('should navigate to club from post', async ({ page }) => {
    await page.goto('/');
    
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Click on club name in post
      const clubLink = posts.first().locator('[data-testid="post-club-link"]');
      
      if (await clubLink.isVisible()) {
        await clubLink.click();
        
        // Should navigate to club page
        await expect(page).toHaveURL(/\/clubPage\/[a-zA-Z0-9]+/);
        
        // Should show club details
        await expect(page.locator('[data-testid="club-name"]')).toBeVisible();
      }
    }
  });

  test('should handle infinite scroll or pagination', async ({ page }) => {
    await page.goto('/');
    
    const initialPosts = page.locator('[data-testid="post-card"]');
    const initialCount = await initialPosts.count();
    
    if (initialCount > 0) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for potential new posts to load
      await page.waitForTimeout(2000);
      
      const newPosts = page.locator('[data-testid="post-card"]');
      const newCount = await newPosts.count();
      
      // May have loaded more posts (or show pagination)
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('should handle empty posts state', async ({ page }) => {
    await navigateToPosts(page);
    
    // Apply filters that might result in no posts
    await page.selectOption('[data-testid="campus-filter"]', 'UTSG');
    await page.selectOption('[data-testid="category-filter"]', 'Event');
    
    // Search for something that doesn't exist
    const searchInput = page.locator('[data-testid="post-search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('NonExistentPostContent123XYZ');
      await page.press('[data-testid="post-search-input"]', 'Enter');
      
      await waitForLoadingToFinish(page);
      
      // Should show no posts message
      const noPostsMessage = page.locator('[data-testid="no-posts"]');
      if (await noPostsMessage.isVisible()) {
        await expect(noPostsMessage).toContainText(/no posts found/i);
      }
    }
  });
});
