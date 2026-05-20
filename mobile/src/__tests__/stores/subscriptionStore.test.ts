/**
 * Tests: Subscription Store
 *
 * These tests verify the subscription store behavior including:
 * - Premium unlocking and expiration
 * - Feature visibility for free vs premium users
 * - Home card visibility rules (SOS always visible)
 * - Premium feature access control
 */

import { act } from "@testing-library/react-native";
import {
  useSubscriptionStore,
  DEFAULT_SIMPLE_VISIBILITY,
} from "../../state/stores/subscriptionStore";

describe("Subscription Store", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useSubscriptionStore.getState().resetSubscription();
    });
  });

  describe("Premium Management", () => {
    it("unlockPremium sets isPremiumUnlocked to true", () => {
      // Verify initial state is not premium
      expect(useSubscriptionStore.getState().isPremiumUnlocked).toBe(false);

      // Unlock premium with monthly tier
      act(() => {
        useSubscriptionStore.getState().unlockPremium("monthly");
      });

      // Verify premium is now unlocked
      const state = useSubscriptionStore.getState();
      expect(state.isPremiumUnlocked).toBe(true);
      expect(state.subscriptionTier).toBe("monthly");
      expect(state.subscriptionStatus).toBe("active");
    });

    it("expireSubscription sets isPremiumUnlocked to false and resets feature visibility", () => {
      // First unlock premium
      act(() => {
        useSubscriptionStore.getState().unlockPremium("annual");
      });

      // Verify premium is active
      expect(useSubscriptionStore.getState().isPremiumUnlocked).toBe(true);

      // Expire the subscription
      act(() => {
        useSubscriptionStore.getState().expireSubscription();
      });

      // Verify premium is expired and features reset
      const state = useSubscriptionStore.getState();
      expect(state.isPremiumUnlocked).toBe(false);
      expect(state.subscriptionStatus).toBe("expired");
      expect(state.featureVisibility).toEqual(DEFAULT_SIMPLE_VISIBILITY);
    });
  });

  describe("Home Card Visibility", () => {
    it("isHomeCardVisible('sos') always returns true regardless of premium status", () => {
      // Test as free user
      expect(useSubscriptionStore.getState().isPremiumUnlocked).toBe(false);
      expect(useSubscriptionStore.getState().isHomeCardVisible("sos")).toBe(true);

      // Unlock premium
      act(() => {
        useSubscriptionStore.getState().unlockPremium("monthly");
      });

      // Test as premium user
      expect(useSubscriptionStore.getState().isPremiumUnlocked).toBe(true);
      expect(useSubscriptionStore.getState().isHomeCardVisible("sos")).toBe(true);

      // Expire subscription
      act(() => {
        useSubscriptionStore.getState().expireSubscription();
      });

      // Test after expiration
      expect(useSubscriptionStore.getState().isPremiumUnlocked).toBe(false);
      expect(useSubscriptionStore.getState().isHomeCardVisible("sos")).toBe(true);
    });
  });

  describe("Premium Feature Access", () => {
    it("Free users can't access premium features via canAccessPremiumFeature", () => {
      // Verify user is free (not premium)
      expect(useSubscriptionStore.getState().isPremiumUnlocked).toBe(false);

      // Verify free user cannot access premium features
      expect(useSubscriptionStore.getState().canAccessPremiumFeature()).toBe(false);

      // Unlock premium
      act(() => {
        useSubscriptionStore.getState().unlockPremium("lifetime");
      });

      // Verify premium user can access premium features
      expect(useSubscriptionStore.getState().canAccessPremiumFeature()).toBe(true);

      // Expire subscription
      act(() => {
        useSubscriptionStore.getState().expireSubscription();
      });

      // Verify expired user cannot access premium features
      expect(useSubscriptionStore.getState().canAccessPremiumFeature()).toBe(false);
    });
  });
});
