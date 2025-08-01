import { test, expect } from '@playwright/test';
import { loginUser, signupUser, logout, TEST_USERS } from '../helpers/test-helpers';

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    // Navigate to auth page first to avoid localStorage security errors
    await page.goto('/auth');
    // Now it's safe to clear localStorage
    await page.evaluate(() => localStorage.clear());
  });

  test('should display auth page correctly', async ({ page }) => {
    await page.goto('/auth');
    
    // Should show login form by default
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Should have signup tab
    await expect(page.locator('[data-testid="signup-tab"]')).toBeVisible();
  });

  test('should switch between login and signup modes', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to signup
    await page.click('[data-testid="signup-tab"]');
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible();
    
    // Switch back to login
    await page.click('[data-testid="login-tab"]');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should show user profile in header
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Should not show auth page
    await expect(page.locator('[data-testid="login-form"]')).not.toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid/i);
    
    // Should stay on auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should signup new user', async ({ page }) => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'newpassword123',
      name: 'New Test User'
    };
    
    await signupUser(page, newUser.email, newUser.password, newUser.name);
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should show user profile
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should show error for password mismatch in signup', async ({ page }) => {
    await page.goto('/auth');
    await page.click('[data-testid="signup-tab"]');
    
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'differentpassword');
    await page.click('[data-testid="signup-button"]');
    
    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/password/i);
  });

  test('should logout user', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
    
    // Logout
    await logout(page);
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
    
    // Should not show user profile
    await expect(page.locator('[data-testid="user-profile"]')).not.toBeVisible();
  });

  test('should persist login after page reload', async ({ page }) => {
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('should handle Google OAuth login', async ({ page }) => {
    await page.goto('/auth');
    
    // Should show Google login button
    await expect(page.locator('[data-testid="google-login-button"]')).toBeVisible();
    
    // Note: Actual OAuth testing would require special setup
    // This tests the UI presence
  });

  test('should handle password reset', async ({ page }) => {
    await page.goto('/auth');
    
    // Click forgot password
    await page.click('[data-testid="forgot-password-link"]');
    
    // Should show reset form
    await expect(page.locator('[data-testid="reset-form"]')).toBeVisible();
    
    // Fill and submit
    await page.fill('[data-testid="reset-email-input"]', TEST_USERS.REGULAR_USER.email);
    await page.click('[data-testid="reset-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should redirect authenticated users away from auth page', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
    
    // Try to go to auth page
    await page.goto('/auth');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
  });
});
