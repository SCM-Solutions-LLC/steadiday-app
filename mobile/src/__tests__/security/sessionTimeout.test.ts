/**
 * Security Tests: Session Timeout and Background Lock
 *
 * These tests verify Attack Story 2 defense: Stolen Device Session Hijack
 *
 * Tests cover:
 * 1. Inactivity timeout (15 minutes)
 * 2. Background timeout (5 minutes)
 * 3. Session lock behavior
 * 4. Navigation blocking after timeout
 */

import { SessionManager, INACTIVITY_TIMEOUT, BACKGROUND_TIMEOUT } from '../../utils/sessionManager';

// Mock Date.now() for time simulation
let mockNow = Date.now();
const realDateNow = Date.now.bind(global.Date);
global.Date.now = jest.fn(() => mockNow);

describe('Session Timeout and Background Lock (Attack Story 2)', () => {
  beforeEach(() => {
    // Reset SessionManager state
    SessionManager.destroy();
    // Reset mock time
    mockNow = realDateNow();
    // Clear all timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    SessionManager.destroy();
  });

  describe('Inactivity Timeout (15 minutes)', () => {
    test('session stays valid with recent activity', () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Advance time by 10 minutes (less than timeout)
      mockNow += 10 * 60 * 1000;

      expect(SessionManager.shouldLock()).toBe(false);
    });

    test('session locks after 15 minutes of inactivity', () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Advance time by 15 minutes and 1 second
      mockNow += INACTIVITY_TIMEOUT + 1000;

      expect(SessionManager.shouldLock()).toBe(true);
    });

    test('activity resets the inactivity timer', () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Advance time by 10 minutes
      mockNow += 10 * 60 * 1000;

      // User interacts with app
      SessionManager.updateActivity();

      // Advance another 10 minutes (20 total, but only 10 since last activity)
      mockNow += 10 * 60 * 1000;

      expect(SessionManager.shouldLock()).toBe(false);
    });

    test('exact timeout boundary locks session', () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Advance exactly 15 minutes
      mockNow += INACTIVITY_TIMEOUT;

      expect(SessionManager.shouldLock()).toBe(true);
    });
  });

  describe('Background Timeout (5 minutes)', () => {
    test('background timeout is defined as 5 minutes', () => {
      expect(BACKGROUND_TIMEOUT).toBe(5 * 60 * 1000);
    });

    // NOTE: Background timeout is handled internally via AppState listener
    // These tests verify the timeout constant and the overall lock behavior
    // Manual testing required for actual background/foreground transitions
  });

  describe('Session Lock and Unlock', () => {
    test('session can be unlocked after timeout', async () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Trigger timeout
      mockNow += INACTIVITY_TIMEOUT + 1000;
      expect(SessionManager.shouldLock()).toBe(true);

      // Unlock (simulating correct PIN entry)
      await SessionManager.unlock();

      expect(SessionManager.shouldLock()).toBe(false);
    });

    test('unlocking resets activity timestamp', async () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Trigger timeout
      mockNow += INACTIVITY_TIMEOUT + 1000;

      // Unlock
      await SessionManager.unlock();

      // Advance 10 minutes (would timeout if timestamp not reset)
      mockNow += 10 * 60 * 1000;

      expect(SessionManager.shouldLock()).toBe(false);
    });

    test('clearSession completely resets state', async () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      await SessionManager.clearSession();

      // Session should lock immediately after clear
      expect(SessionManager.shouldLock()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('session locks if never initialized', () => {
      expect(SessionManager.shouldLock()).toBe(true);
    });

    test('session locks if activity never updated', () => {
      SessionManager.initialize();
      // Don't call updateActivity()

      mockNow += 1000; // Any time passes

      expect(SessionManager.shouldLock()).toBe(true);
    });

    test('constants are correctly defined', () => {
      expect(INACTIVITY_TIMEOUT).toBe(15 * 60 * 1000); // 15 minutes
      expect(BACKGROUND_TIMEOUT).toBe(5 * 60 * 1000); // 5 minutes
    });
  });

  describe('Security: Time cannot be manipulated', () => {
    test('negative time advancement does not affect lock state', () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Try to go back in time (should not prevent timeout)
      mockNow -= 5 * 60 * 1000;
      SessionManager.updateActivity();

      // Now advance forward beyond timeout from original time
      mockNow = realDateNow() + INACTIVITY_TIMEOUT + 1000;

      expect(SessionManager.shouldLock()).toBe(true);
    });

    test('session lock decision uses current time, not cached', () => {
      SessionManager.initialize();
      SessionManager.updateActivity();

      // Check lock status (not locked)
      expect(SessionManager.shouldLock()).toBe(false);

      // Advance time
      mockNow += INACTIVITY_TIMEOUT + 1000;

      // Check again - should now be locked
      expect(SessionManager.shouldLock()).toBe(true);
    });
  });
});
