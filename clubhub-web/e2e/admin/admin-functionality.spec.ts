import { test, expect } from '@playwright/test';
import { loginUser, TEST_USERS } from '../helpers/test-helpers';

test.describe('Admin Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    
    // Login as admin user
    await loginUser(page, TEST_USERS.ADMIN_USER.email, TEST_USERS.ADMIN_USER.password);
  });

  test('admin should access admin panel', async ({ page }) => {
    await page.goto('/admin');
    
    // Should see admin dashboard
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-header"]')).toContainText(/admin/i);
    
    // Should see admin navigation
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-clubs-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-management-link"]')).toBeVisible();
  });

  test('admin should view pending club requests', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="pending-clubs-link"]');
    
    // Should show pending clubs page
    await expect(page.locator('[data-testid="pending-clubs-section"]')).toBeVisible();
    await expect(page.getByRole('heading')).toContainText(/pending/i);
    
    // Should show club request cards if any exist
    const clubCards = page.locator('[data-testid="pending-club-card"]');
    const cardCount = await clubCards.count();
    
    if (cardCount > 0) {
      // Should show club details
      const firstCard = clubCards.first();
      await expect(firstCard.locator('[data-testid="club-name"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="club-description"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="approve-button"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="reject-button"]')).toBeVisible();
    }
  });

  test('admin should approve club request', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="pending-clubs-link"]');
    
    const pendingClub = page.locator('[data-testid="pending-club-card"]').first();
    
    if (await pendingClub.isVisible()) {
      const clubName = await pendingClub.locator('[data-testid="club-name"]').textContent();
      
      // Approve the club
      await pendingClub.locator('[data-testid="approve-button"]').click();
      
      // Should show confirmation dialog
      const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
      if (await confirmDialog.isVisible()) {
        await page.click('[data-testid="confirm-approve"]');
      }
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/approved/i);
      
      // Club should be removed from pending list
      if (clubName) {
        await expect(page.locator(`text=${clubName}`)).not.toBeVisible();
      }
    }
  });

  test('admin should reject club request', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="pending-clubs-link"]');
    
    const pendingClub = page.locator('[data-testid="pending-club-card"]').first();
    
    if (await pendingClub.isVisible()) {
      const clubName = await pendingClub.locator('[data-testid="club-name"]').textContent();
      
      // Reject the club
      await pendingClub.locator('[data-testid="reject-button"]').click();
      
      // Should show reason dialog
      const reasonDialog = page.locator('[data-testid="reject-reason-dialog"]');
      if (await reasonDialog.isVisible()) {
        await page.fill('[data-testid="rejection-reason"]', 'Insufficient information provided');
        await page.click('[data-testid="confirm-reject"]');
      }
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/rejected/i);
      
      // Club should be removed from pending list
      if (clubName) {
        await expect(page.locator(`text=${clubName}`)).not.toBeVisible();
      }
    }
  });

  test('admin should view club details before approval', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="pending-clubs-link"]');
    
    const pendingClub = page.locator('[data-testid="pending-club-card"]').first();
    
    if (await pendingClub.isVisible()) {
      // Click view details
      await pendingClub.locator('[data-testid="view-details-button"]').click();
      
      // Should show detailed view
      await expect(page.locator('[data-testid="club-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-club-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-club-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-contact-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-club-tags"]')).toBeVisible();
      
      // Should have approve/reject actions in modal
      await expect(page.locator('[data-testid="modal-approve-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="modal-reject-button"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-testid="close-modal"]');
      await expect(page.locator('[data-testid="club-details-modal"]')).not.toBeVisible();
    }
  });

  test('admin should manage users', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="user-management-link"]');
    
    // Should show user management page
    await expect(page.locator('[data-testid="user-management-section"]')).toBeVisible();
    await expect(page.getByRole('heading')).toContainText(/user/i);
    
    // Should show user list
    const userList = page.locator('[data-testid="user-list"]');
    await expect(userList).toBeVisible();
    
    // Should show user cards
    const userCards = page.locator('[data-testid="user-card"]');
    const userCount = await userCards.count();
    
    if (userCount > 0) {
      const firstUser = userCards.first();
      await expect(firstUser.locator('[data-testid="user-email"]')).toBeVisible();
      await expect(firstUser.locator('[data-testid="user-role"]')).toBeVisible();
      await expect(firstUser.locator('[data-testid="user-status"]')).toBeVisible();
    }
  });

  test('admin should search and filter users', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="user-management-link"]');
    
    // Search for users
    const searchInput = page.locator('[data-testid="user-search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test@example.com');
      await page.press('[data-testid="user-search-input"]', 'Enter');
      
      // Should filter results
      await page.waitForLoadState('networkidle');
      const filteredUsers = page.locator('[data-testid="user-card"]');
      const count = await filteredUsers.count();
      
      if (count > 0) {
        // Each visible user should match search
        await expect(filteredUsers.first().locator('[data-testid="user-email"]')).toContainText('test');
      }
    }
    
    // Filter by role
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption({ label: 'Admin' });
      
      // Should show only admin users
      await page.waitForLoadState('networkidle');
      const adminUsers = page.locator('[data-testid="user-card"]');
      const adminCount = await adminUsers.count();
      
      if (adminCount > 0) {
        await expect(adminUsers.first().locator('[data-testid="user-role"]')).toContainText(/admin/i);
      }
    }
  });

  test('admin should view site statistics', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show statistics dashboard
    await expect(page.locator('[data-testid="stats-section"]')).toBeVisible();
    
    // Should show key metrics
    await expect(page.locator('[data-testid="total-users-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-clubs-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-posts-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-requests-stat"]')).toBeVisible();
    
    // Stats should contain numbers
    const usersStat = page.locator('[data-testid="total-users-stat"] .stat-number');
    if (await usersStat.isVisible()) {
      const usersText = await usersStat.textContent();
      expect(usersText).toMatch(/\d+/);
    }
    
    const clubsStat = page.locator('[data-testid="total-clubs-stat"] .stat-number');
    if (await clubsStat.isVisible()) {
      const clubsText = await clubsStat.textContent();
      expect(clubsText).toMatch(/\d+/);
    }
  });

  test('admin should export data', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for export functionality
    const exportButton = page.locator('[data-testid="export-data-button"]');
    
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      // Should show export options
      const exportModal = page.locator('[data-testid="export-modal"]');
      if (await exportModal.isVisible()) {
        // Select export type
        await page.check('[data-testid="export-users"]');
        await page.check('[data-testid="export-clubs"]');
        
        await page.click('[data-testid="confirm-export"]');
        
        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/export.*\.(csv|json|xlsx)$/);
      }
    }
  });

  test('admin should moderate posts', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to post moderation if available
    const postModerationLink = page.locator('[data-testid="post-moderation-link"]');
    
    if (await postModerationLink.isVisible()) {
      await postModerationLink.click();
      
      // Should show reported posts
      await expect(page.locator('[data-testid="reported-posts-section"]')).toBeVisible();
      
      const reportedPosts = page.locator('[data-testid="reported-post-card"]');
      const postCount = await reportedPosts.count();
      
      if (postCount > 0) {
        const firstPost = reportedPosts.first();
        
        // Should show post details and moderation actions
        await expect(firstPost.locator('[data-testid="post-content"]')).toBeVisible();
        await expect(firstPost.locator('[data-testid="report-reason"]')).toBeVisible();
        await expect(firstPost.locator('[data-testid="approve-post-button"]')).toBeVisible();
        await expect(firstPost.locator('[data-testid="remove-post-button"]')).toBeVisible();
      }
    }
  });

  test('admin should receive notifications', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin notifications
    const notificationBell = page.locator('[data-testid="admin-notifications"]');
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      
      // Should show notification dropdown
      const notificationDropdown = page.locator('[data-testid="notifications-dropdown"]');
      await expect(notificationDropdown).toBeVisible();
      
      // Should show notification items
      const notifications = page.locator('[data-testid="notification-item"]');
      const notificationCount = await notifications.count();
      
      if (notificationCount > 0) {
        const firstNotification = notifications.first();
        await expect(firstNotification.locator('[data-testid="notification-message"]')).toBeVisible();
        await expect(firstNotification.locator('[data-testid="notification-time"]')).toBeVisible();
      }
    }
  });

  test('admin should manage system settings', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to settings if available
    const settingsLink = page.locator('[data-testid="system-settings-link"]');
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      
      // Should show settings page
      await expect(page.locator('[data-testid="system-settings-section"]')).toBeVisible();
      
      // Should show various setting categories
      await expect(page.locator('[data-testid="general-settings"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-settings"]')).toBeVisible();
      await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
      
      // Test updating a setting
      const maintenanceMode = page.locator('[data-testid="maintenance-mode-toggle"]');
      if (await maintenanceMode.isVisible()) {
        const initialState = await maintenanceMode.isChecked();
        await maintenanceMode.click();
        
        // Should show save button
        await expect(page.locator('[data-testid="save-settings-button"]')).toBeVisible();
        await page.click('[data-testid="save-settings-button"]');
        
        // Should show success message
        await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible();
        
        // Restore original state
        await maintenanceMode.setChecked(initialState);
        await page.click('[data-testid="save-settings-button"]');
      }
    }
  });

  test('regular user should not access admin panel', async ({ page }) => {
    // Logout admin and login as regular user
    await page.goto('/auth');
    await page.click('[data-testid="logout-button"]');
    
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
    
    // Try to access admin page
    await page.goto('/admin');
    
    // Should be redirected or show access denied
    const currentUrl = page.url();
    const isOnAdminPage = currentUrl.includes('/admin');
    
    if (isOnAdminPage) {
      // Should show access denied message
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    } else {
      // Should be redirected to home or login
      expect(currentUrl).toMatch(/\/(home|auth|$)/);
    }
  });
});
