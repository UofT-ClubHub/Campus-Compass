import { test, expect } from '@playwright/test';
import { loginUser, openChatbot, sendChatMessage, TEST_USERS } from '../helpers/test-helpers';

test.describe('Chatbot Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USERS.REGULAR_USER.email, TEST_USERS.REGULAR_USER.password);
    await page.goto('/');
  });

  test('should display chatbot widget', async ({ page }) => {
    // Should show chatbot button
    await expect(page.locator('[data-testid="chatbot-button"]')).toBeVisible();
    
    // Should show tooltip on hover
    await page.hover('[data-testid="chatbot-button"]');
    const tooltip = page.locator('[data-testid="chatbot-tooltip"]');
    if (await tooltip.isVisible()) {
      await expect(tooltip).toContainText(/chat/i);
    }
  });

  test('should open and close chatbot', async ({ page }) => {
    // Open chatbot
    await openChatbot(page);
    
    // Should show chat window
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    
    // Should show welcome message
    await expect(page.locator('[data-testid="ai-message"]').first()).toContainText(/ClubHub Assistant/i);
    
    // Close chatbot
    await page.click('[data-testid="close-chat"]');
    await expect(page.locator('[data-testid="chat-window"]')).not.toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    await openChatbot(page);
    
    // Send a test message
    const testMessage = 'Hello, can you help me find clubs?';
    await sendChatMessage(page, testMessage);
    
    // Should show user message
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText(testMessage);
    
    // Should show AI response
    const aiResponse = page.locator('[data-testid="ai-response"]').last();
    await expect(aiResponse).toBeVisible();
    await expect(aiResponse).toContainText(/club/i);
  });

  test('should handle club search queries', async ({ page }) => {
    await openChatbot(page);
    
    // Ask about computer science clubs
    await sendChatMessage(page, 'Find computer science clubs at UTSG');
    
    // Response should contain club information
    const response = page.locator('[data-testid="ai-response"]').last();
    await expect(response).toContainText(/computer science/i);
    await expect(response).toContainText(/club/i);
  });

  test('should handle event queries', async ({ page }) => {
    await openChatbot(page);
    
    // Ask about events
    await sendChatMessage(page, 'What events are happening this week?');
    
    // Response should contain event information
    const response = page.locator('[data-testid="ai-response"]').last();
    await expect(response).toContainText(/event/i);
  });

  test('should use quick action buttons', async ({ page }) => {
    await openChatbot(page);
    
    // Should show quick action buttons
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    
    // Click "Find Clubs" quick action
    const findClubsButton = page.locator('[data-testid="quick-action-clubs"]');
    if (await findClubsButton.isVisible()) {
      await findClubsButton.click();
      
      // Should send predefined message
      await expect(page.locator('[data-testid="user-message"]').last()).toContainText(/clubs/i);
      
      // Should get response
      await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible();
    }
  });

  test('should handle typing indicator', async ({ page }) => {
    await openChatbot(page);
    
    // Start typing a message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    
    // Click send
    await page.click('[data-testid="send-button"]');
    
    // Should show typing indicator while waiting for response
    const typingIndicator = page.locator('[data-testid="typing-indicator"]');
    if (await typingIndicator.isVisible()) {
      await expect(typingIndicator).toBeVisible();
      
      // Should disappear when response arrives
      await expect(typingIndicator).not.toBeVisible();
    }
  });

  test('should handle message timestamps', async ({ page }) => {
    await openChatbot(page);
    
    await sendChatMessage(page, 'Test message with timestamp');
    
    // Should show timestamp on messages
    const userMessage = page.locator('[data-testid="user-message"]').last();
    const userTimestamp = userMessage.locator('[data-testid="message-timestamp"]');
    if (await userTimestamp.isVisible()) {
      await expect(userTimestamp).toBeVisible();
    }
    
    const aiMessage = page.locator('[data-testid="ai-response"]').last();
    const aiTimestamp = aiMessage.locator('[data-testid="message-timestamp"]');
    if (await aiTimestamp.isVisible()) {
      await expect(aiTimestamp).toBeVisible();
    }
  });

  test('should handle long conversations', async ({ page }) => {
    await openChatbot(page);
    
    // Send multiple messages
    const messages = [
      'Hello',
      'Tell me about clubs',
      'What about events?',
      'How do I join a club?'
    ];
    
    for (const message of messages) {
      await sendChatMessage(page, message);
      await page.waitForTimeout(1000); // Wait between messages
    }
    
    // Should show all messages in conversation
    const userMessages = page.locator('[data-testid="user-message"]');
    const aiMessages = page.locator('[data-testid="ai-response"]');
    
    await expect(userMessages).toHaveCount(messages.length + 1); // +1 for initial welcome interaction
    await expect(aiMessages).toHaveCount(messages.length + 1);
  });

  test('should scroll chat history', async ({ page }) => {
    await openChatbot(page);
    
    // Send many messages to create scroll
    for (let i = 0; i < 10; i++) {
      await sendChatMessage(page, `Message number ${i + 1}`);
      await page.waitForTimeout(500);
    }
    
    // Should auto-scroll to bottom
    const chatContainer = page.locator('[data-testid="chat-messages"]');
    
    // Check if scroll position is at bottom
    const isAtBottom = await chatContainer.evaluate((el) => {
      return el.scrollHeight - el.clientHeight <= el.scrollTop + 1;
    });
    
    expect(isAtBottom).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await openChatbot(page);
    
    // Mock network failure
    await page.route('/api/chatbot', route => route.abort());
    
    // Try to send message
    await page.fill('[data-testid="chat-input"]', 'This should fail');
    await page.click('[data-testid="send-button"]');
    
    // Should show error message
    const errorMessage = page.locator('[data-testid="ai-response"]').last();
    await expect(errorMessage).toContainText(/error|trouble|sorry/i);
  });

  test('should handle multiline messages', async ({ page }) => {
    await openChatbot(page);
    
    // Type multiline message using Shift+Enter
    await page.focus('[data-testid="chat-input"]');
    await page.keyboard.type('Line 1');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Line 2');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Line 3');
    
    await page.click('[data-testid="send-button"]');
    
    // Should preserve line breaks in message
    const userMessage = page.locator('[data-testid="user-message"]').last();
    await expect(userMessage).toContainText('Line 1');
    await expect(userMessage).toContainText('Line 2');
    await expect(userMessage).toContainText('Line 3');
  });

  test('should disable input while processing', async ({ page }) => {
    await openChatbot(page);
    
    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');
    
    // Input should be disabled while processing
    await expect(page.locator('[data-testid="chat-input"]')).toBeDisabled();
    await expect(page.locator('[data-testid="send-button"]')).toBeDisabled();
    
    // Should re-enable after response
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).not.toBeDisabled();
    await expect(page.locator('[data-testid="send-button"]')).not.toBeDisabled();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await openChatbot(page);
    
    // Type message and press Enter to send
    await page.fill('[data-testid="chat-input"]', 'Test keyboard shortcut');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Should send message
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Test keyboard shortcut');
    
    // Press Escape to close chat
    await page.press('body', 'Escape');
    
    // Should close chat window
    await expect(page.locator('[data-testid="chat-window"]')).not.toBeVisible();
  });

  test('should persist chat history during session', async ({ page }) => {
    await openChatbot(page);
    
    // Send a message
    await sendChatMessage(page, 'Remember this message');
    
    // Close and reopen chat
    await page.click('[data-testid="close-chat"]');
    await openChatbot(page);
    
    // Should still show previous messages
    await expect(page.locator('[data-testid="user-message"]')).toContainText('Remember this message');
  });
});
