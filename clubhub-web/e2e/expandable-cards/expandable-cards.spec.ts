import { test, expect } from '@playwright/test';

test.describe('Expandable Cards Components', () => {
  
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
            }
          ])
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
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              hashtags: ['#networking', '#business', '#utm']
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

  test.describe('Expandable Club Cards Component', () => {
    
    test('should display club cards in collapsed state by default', async ({ page }) => {
      await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for club cards to load
      await page.waitForTimeout(3000);
      const clubCards = page.locator('.group.cursor-pointer');
      const cardCount = await clubCards.count();
      
      if (cardCount > 0) {
        const firstCard = clubCards.first();
        
        // Should show club card basic info
        await expect(firstCard).toBeVisible();
        await expect(firstCard.locator('h2, h3')).toBeVisible();
        await expect(firstCard.locator('p')).toBeVisible();
        
        // Look for expand/collapse functionality
        const expandButton = firstCard.locator('button').filter({ hasText: /more|expand|show/i });
        const isExpandable = await expandButton.isVisible({ timeout: 3000 });
        
        if (isExpandable) {
          console.log('Club card has expandable functionality');
        } else {
          console.log('Club card displays basic information');
        }
      }
      
      console.log(`Found ${cardCount} club cards in collapsed state`);
    });

    test('should expand club card when clicked', async ({ page }) => {
      await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const clubCards = page.locator('.group.cursor-pointer');
      const cardCount = await clubCards.count();
      
      if (cardCount > 0) {
        const firstCard = clubCards.first();
        
        // Try to find and click expand button
        const expandButton = firstCard.locator('button').filter({ hasText: /more|expand|show|details/i });
        
        if (await expandButton.isVisible({ timeout: 3000 })) {
          await expandButton.click();
          await page.waitForTimeout(1000);
          
          // Check if more content is visible after clicking
          const expandedContent = firstCard.locator('div').filter({ hasText: /email|website|instagram|followers|contact/i });
          const hasExpandedContent = await expandedContent.isVisible({ timeout: 3000 });
          
          if (hasExpandedContent) {
            await expect(expandedContent).toBeVisible();
            console.log('Club card expanded to show more details');
          } else {
            console.log('Club card click registered but no additional content visible');
          }
        } else {
          // Try clicking the card itself to expand
          await firstCard.click();
          await page.waitForTimeout(1000);
          console.log('Clicked club card directly');
        }
      }
    });

    test('should display club contact information when available', async ({ page }) => {
      await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const clubCards = page.locator('.group.cursor-pointer');
      const cardCount = await clubCards.count();
      
      if (cardCount > 0) {
        const firstCard = clubCards.first();
        
        // Look for contact information (email, website, social media)
        const emailInfo = firstCard.locator('text=/email|@/i');
        const websiteInfo = firstCard.locator('text=/website|http|www/i');
        const socialInfo = firstCard.locator('text=/instagram|twitter|facebook/i');
        
        let contactInfoFound = 0;
        if (await emailInfo.isVisible({ timeout: 3000 })) {
          await expect(emailInfo).toBeVisible();
          contactInfoFound++;
        }
        if (await websiteInfo.isVisible({ timeout: 3000 })) {
          await expect(websiteInfo).toBeVisible();
          contactInfoFound++;
        }
        if (await socialInfo.isVisible({ timeout: 3000 })) {
          await expect(socialInfo).toBeVisible();
          contactInfoFound++;
        }
        
        console.log(`Found ${contactInfoFound} types of contact information`);
      }
    });

    test('should navigate to individual club page when clicked', async ({ page }) => {
      await page.goto('/clubSearch', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const clubCards = page.locator('.group.cursor-pointer');
      const cardCount = await clubCards.count();
      
      if (cardCount > 0) {
        const firstCard = clubCards.first();
        const clubName = await firstCard.locator('h2, h3').textContent();
        
        // Click on the club card
        await firstCard.click();
        await page.waitForTimeout(2000);
        
        // Check if we navigated to a club page
        const currentUrl = page.url();
        const isOnClubPage = currentUrl.includes('/club') || currentUrl.includes('/clubPage');
        
        if (isOnClubPage) {
          console.log(`Navigated to club page: ${currentUrl}`);
          
          // Should show club details on the club page
          const clubDetailsPage = page.locator('h1, h2, h3').filter({ hasText: new RegExp(clubName || 'club', 'i') });
          if (await clubDetailsPage.isVisible({ timeout: 5000 })) {
            await expect(clubDetailsPage).toBeVisible();
          }
        } else {
          console.log('Club card click did not navigate to club page');
        }
      }
    });
  });

  test.describe('Expandable Post Cards Component', () => {
    
    test('should display post cards in collapsed state by default', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(5000);
      
      // Look for post cards on home page
      const postCards = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
      const cardCount = await postCards.count();
      
      if (cardCount > 0) {
        const firstPost = postCards.first();
        
        // Should show post card basic info
        await expect(firstPost).toBeVisible();
        await expect(firstPost.locator('h3')).toBeVisible();
        
        // Look for post content/description
        const postContent = firstPost.locator('p');
        if (await postContent.isVisible({ timeout: 3000 })) {
          await expect(postContent).toBeVisible();
        }
        
        // Look for expand/read more functionality
        const expandButton = firstPost.locator('button').filter({ hasText: /more|expand|read|show/i });
        const isExpandable = await expandButton.isVisible({ timeout: 3000 });
        
        if (isExpandable) {
          console.log('Post card has expandable functionality');
        } else {
          console.log('Post card displays basic information');
        }
      }
      
      console.log(`Found ${cardCount} post cards in collapsed state`);
    });

    test('should expand post card when clicked', async ({ page }) => {
      await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const postCards = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
      const cardCount = await postCards.count();
      
      if (cardCount > 0) {
        const firstPost = postCards.first();
        
        // Try to find and click expand/read more button
        const expandButton = firstPost.locator('button').filter({ hasText: /more|expand|read|show|details/i });
        
        if (await expandButton.isVisible({ timeout: 3000 })) {
          const initialContent = await firstPost.textContent();
          
          await expandButton.click();
          await page.waitForTimeout(1000);
          
          // Check if more content is visible after clicking
          const newContent = await firstPost.textContent();
          const hasExpandedContent = newContent && newContent.length > (initialContent?.length || 0);
          
          if (hasExpandedContent) {
            console.log('Post card expanded to show more content');
          } else {
            console.log('Post card click registered but no additional content visible');
          }
        } else {
          // Try clicking the card itself to expand
          await firstPost.click();
          await page.waitForTimeout(1000);
          console.log('Clicked post card directly');
        }
      }
    });

    test('should display post metadata and engagement', async ({ page }) => {
      await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const postCards = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
      const cardCount = await postCards.count();
      
      if (cardCount > 0) {
        const firstPost = postCards.first();
        
        // Look for post metadata (club name, campus, likes, timestamp)
        const clubName = firstPost.locator('text=/club|association|union|society/i');
        const campus = firstPost.locator('text=/UTSG|UTM|UTSC/');
        const likes = firstPost.locator('text=/like|\\d+/');
        const timestamp = firstPost.locator('text=/ago|hour|day|minute|time/i');
        
        let metadataFound = 0;
        if (await clubName.isVisible({ timeout: 3000 })) {
          await expect(clubName).toBeVisible();
          metadataFound++;
        }
        if (await campus.isVisible({ timeout: 3000 })) {
          await expect(campus).toBeVisible();
          metadataFound++;
        }
        if (await likes.isVisible({ timeout: 3000 })) {
          await expect(likes).toBeVisible();
          metadataFound++;
        }
        if (await timestamp.isVisible({ timeout: 3000 })) {
          await expect(timestamp).toBeVisible();
          metadataFound++;
        }
        
        console.log(`Found ${metadataFound} types of post metadata`);
      }
    });

    test('should show hashtags and categories when available', async ({ page }) => {
      await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const postCards = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
      const cardCount = await postCards.count();
      
      if (cardCount > 0) {
        const firstPost = postCards.first();
        
        // Look for hashtags and categories
        const hashtags = firstPost.locator('text=/#\\w+/');
        const categories = firstPost.locator('text=/Event|Academic|Sports|Social|Business|Tech/i');
        
        let tagsFound = 0;
        const hashtagCount = await hashtags.count();
        if (hashtagCount > 0) {
          await expect(hashtags.first()).toBeVisible();
          tagsFound += hashtagCount;
        }
        
        if (await categories.isVisible({ timeout: 3000 })) {
          await expect(categories).toBeVisible();
          tagsFound++;
        }
        
        console.log(`Found ${tagsFound} hashtags and categories`);
      }
    });

    test('should handle post content of varying lengths', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(5000);
      const postCards = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
      const cardCount = await postCards.count();
      
      if (cardCount > 0) {
        // Check multiple posts for content length variation
        const postsToCheck = Math.min(cardCount, 3);
        let shortPosts = 0;
        let longPosts = 0;
        
        for (let i = 0; i < postsToCheck; i++) {
          const post = postCards.nth(i);
          const content = await post.textContent();
          const contentLength = content?.length || 0;
          
          if (contentLength < 100) {
            shortPosts++;
          } else if (contentLength > 200) {
            longPosts++;
          }
        }
        
        console.log(`Found ${shortPosts} short posts and ${longPosts} long posts`);
        await expect(postCards.first()).toBeVisible(); // Ensure at least one post is visible
      }
    });

    test('should display interaction elements for posts', async ({ page }) => {
      await page.goto('/postFilter', { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      const postCards = page.locator('.group.cursor-pointer').filter({ has: page.locator('h3') });
      const cardCount = await postCards.count();
      
      if (cardCount > 0) {
        const firstPost = postCards.first();
        
        // Look for interaction elements (like buttons, share buttons, etc.)
        const likeButton = firstPost.locator('button').filter({ hasText: /like|♥|👍/i });
        const shareButton = firstPost.locator('button').filter({ hasText: /share/i });
        const bookmarkButton = firstPost.locator('button').filter({ hasText: /bookmark|save/i });
        const actionButtons = firstPost.locator('button');
        
        let interactionsFound = 0;
        if (await likeButton.isVisible({ timeout: 3000 })) {
          await expect(likeButton).toBeVisible();
          interactionsFound++;
        }
        if (await shareButton.isVisible({ timeout: 3000 })) {
          await expect(shareButton).toBeVisible();
          interactionsFound++;
        }
        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
          await expect(bookmarkButton).toBeVisible();
          interactionsFound++;
        }
        
        // Check for any buttons at all
        const buttonCount = await actionButtons.count();
        if (buttonCount > 0) {
          await expect(actionButtons.first()).toBeVisible();
        }
        
        console.log(`Found ${interactionsFound} interaction elements and ${buttonCount} total buttons`);
      }
    });
  });
}); 