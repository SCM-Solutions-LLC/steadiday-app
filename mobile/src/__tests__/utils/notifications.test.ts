/**
 * Tests for notification utility functions
 *
 * These tests verify the getAlertMinutes function correctly converts
 * AlertTiming values to their corresponding minute offsets.
 */

import { getAlertMinutes } from "../../utils/notifications";
import { AlertTiming } from "../../types/app";

describe("getAlertMinutes", () => {
  it("getAlertMinutes returns correct values for each AlertTiming option", () => {
    // Test all AlertTiming values
    expect(getAlertMinutes("at-time" as AlertTiming)).toBe(0);
    expect(getAlertMinutes("5-before" as AlertTiming)).toBe(5);
    expect(getAlertMinutes("10-before" as AlertTiming)).toBe(10);
    expect(getAlertMinutes("15-before" as AlertTiming)).toBe(15);
    expect(getAlertMinutes("30-before" as AlertTiming)).toBe(30);
    expect(getAlertMinutes("1-hour-before" as AlertTiming)).toBe(60);
  });

  it("Edge case: undefined input returns -1", () => {
    expect(getAlertMinutes(undefined)).toBe(-1);
  });
});
