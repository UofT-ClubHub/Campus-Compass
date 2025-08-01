import { Page, expect } from '@playwright/test';

// Test user accounts
export const TEST_USERS = {
  REGULAR_USER: {
    email: 'test.user@example.com',
    password: 'testpass123',
    name: 'Test User'
  },
  ADMIN_USER: {
    email: 'admin@example.com', 
    password: 'adminpass123',
    name: 'Admin User'
  },
  EXECUTIVE_USER: {
    email: 'exec@example.com',
    password: 'execpass123',
    name: 'Executive User'
  }
};

// Test club data
export const TEST_CLUBS = {
  CS_CLUB: {
    name: 'Computer Science Student Union',
    description: 'The official CS student union',
    campus: 'UTSG'
  },
  BUSINESS_CLUB: {
    name: 'Business Student Association',
    description: 'Business networking and events',
    campus: 'UTM'
  }
};

// Authentication helpers
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth');
  
  // Ensure we're in login mode
  const loginTab = page.locator('[data-testid="login-tab"]');
  if (await loginTab.isVisible()) {
    await loginTab.click();
  }
  
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect to home page
  await expect(page).toHaveURL('/');
  
  // Verify user is logged in
  await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
}

export async function signupUser(page: Page, email: string, password: string, name: string) {
  await page.goto('/auth');
  
  // Switch to signup mode
  await page.click('[data-testid="signup-tab"]');
  
  await page.fill('[data-testid="name-input"]', name);
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.fill('[data-testid="confirm-password-input"]', password);
  await page.click('[data-testid="signup-button"]');
  
  // Wait for redirect
  await expect(page).toHaveURL('/');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-profile"]');
  await page.click('[data-testid="logout-button"]');
  await expect(page).toHaveURL('/auth');
}

// Navigation helpers
export async function navigateToClubs(page: Page) {
  await page.click('[data-testid="nav-clubs"]');
  await expect(page).toHaveURL('/clubSearch');
}

export async function navigateToPosts(page: Page) {
  await page.click('[data-testid="nav-posts"]');
  await expect(page).toHaveURL('/postFilter');
}

export async function navigateToProfile(page: Page) {
  await page.click('[data-testid="nav-profile"]');
  await expect(page).toHaveURL('/profile');
}

// Club interaction helpers
export async function followClub(page: Page, clubName: string) {
  await page.locator(`[data-testid="club-card"]:has-text("${clubName}")`).click();
  await page.click('[data-testid="follow-button"]');
  await expect(page.locator('[data-testid="follow-button"]')).toContainText('Following');
}

export async function unfollowClub(page: Page) {
  await page.click('[data-testid="follow-button"]');
  await expect(page.locator('[data-testid="follow-button"]')).toContainText('Follow');
}

// Post interaction helpers
export async function likePost(page: Page, postIndex: number = 0) {
  const posts = page.locator('[data-testid="post-card"]');
  const targetPost = posts.nth(postIndex);
  const likeButton = targetPost.locator('[data-testid="like-button"]');
  
  await likeButton.click();
  await expect(likeButton).toHaveClass(/liked/);
}

// Chatbot helpers
export async function openChatbot(page: Page) {
  await page.click('[data-testid="chatbot-button"]');
  await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
}

export async function sendChatMessage(page: Page, message: string) {
  await page.fill('[data-testid="chat-input"]', message);
  await page.click('[data-testid="send-button"]');
  
  // Wait for user message to appear
  await expect(page.locator('[data-testid="user-message"]').last()).toContainText(message);
  
  // Wait for AI response
  await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible();
}

// Theme helpers
export async function switchTheme(page: Page, themeName: string) {
  // Open theme selector if it exists
  const themeSelector = page.locator('[data-testid="theme-selector"]');
  if (await themeSelector.isVisible()) {
    await themeSelector.click();
    await page.click(`[data-testid="theme-${themeName}"]`);
  }
  
  // Verify theme is applied
  await expect(page.locator('html')).toHaveAttribute('data-theme', themeName);
}

// Admin helpers
export async function navigateToAdmin(page: Page) {
  await page.goto('/admin');
  await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
}

export async function approvePendingClub(page: Page, clubName: string) {
  const clubRow = page.locator(`[data-testid="pending-club"]:has-text("${clubName}")`);
  await clubRow.locator('[data-testid="approve-button"]').click();
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
}

// Utilities
export async function waitForLoadingToFinish(page: Page) {
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  if (await loadingSpinner.isVisible()) {
    await loadingSpinner.waitFor({ state: 'hidden' });
  }
}

export async function clearAndType(page: Page, selector: string, text: string) {
  await page.click(selector);
  await page.keyboard.press('Control+a');
  await page.keyboard.type(text);
}
